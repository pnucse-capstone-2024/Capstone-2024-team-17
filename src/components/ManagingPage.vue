<template>
    <div class="content">
      <figure class="left-video"><img src="../../public/img/blockchain.png" alt="Coffee Cup"></figure>
      <div class="right-side">
        <h2>Managing Page</h2>
  
        <!-- 옵션 선택 박스 -->
        <div class="option-selector">
          <select v-model="selectedOption" id="options">
            <option value="CurrentStock">Current stock</option>
            <option value="ReceivingHistory">Receiving history</option>
            <option value="SalesStatus">Sales status</option>
            <option value="SalesTable">Sales table</option>
          </select>
        </div>
  
        <!-- 선택된 옵션에 따라 다른 화면 표시 -->
        <div id="panel" class="panel-container">
          <!-- Current Stock -->
          <div v-if="selectedOption === 'CurrentStock'">
            <h3>Current Stock</h3>
            <h2>unit: 100g</h2>
            <div v-if="coffeeData.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th v-for="option in options" :key="option.type">{{ option.type }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(coffee, index) in coffeeData" :key="index">
                    <td>{{ coffee.coffeeName }}</td>
                    <td v-for="(option, idx) in options" :key="idx">
                      {{ getAvailableQuantity(coffee.coffeeName, option.type) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else>
              <p>No stock available.</p>
            </div>
          </div>
  
      <!-- Receiving History -->
      <div v-if="selectedOption === 'ReceivingHistory'">
        <h3>Receiving history</h3>
        <div v-if="isConnected">
          <table>
            <thead>
              <tr>
                <th>Entry Date</th>
                <th>P-date</th>
                <th>Item</th>
                <th>Type</th>
                <th>Origin</th>
                <th>Quantity (kg)</th>
                <th>Entry Price</th>
                <th>TxHash</th>
              </tr>
            </thead>
              <tbody>
                <tr v-for="(data, index) in storedData" :key="index">
                <td>{{ formatTimestamp(Number(data.timestamp)) }}</td> <!-- Entry Date from StoredRecInfo -->
                <td>{{ formatTimestamp(Number(eventData[data.txHash]?.timestamp)) }}</td> <!-- P-date from event data -->
                <td>{{ eventData[data.txHash]?.coffeeName || 'Unknown' }}</td>
                <td>{{ eventData[data.txHash]?.coffeeType || 'Unknown' }}</td>
                <td>{{ eventData[data.txHash]?.origin || '' }}</td>
                <td>{{ eventData[data.txHash]?.quantity || 'Unknown' }}</td>
                <td>{{ eventData[data.txHash]?.totalPrice || 'Unknown' }}</td>
                <td>
                  <!-- Display truncated txHash -->
                  <span @click="showFullTxHash(data.txHash)" class="txhash-short"><span class="break-word">{{ truncateTxHash(data.txHash) }}</span></span>
                  <!-- Full txHash modal -->
                  <div v-if="showModal && selectedTxHash === data.txHash" class="modal-overlay" @click.self="closeModal">
                  <div class="modal">
                      <h4>Transaction Hash</h4>
                      <p><span class="break-word">{{ data.txHash }}</span></p>
                      <button @click="closeModal" class="modal-close-btn">Close</button>
                  </div>
                  </div>
                </td>
                </tr>
              </tbody>
              </table>
          </div>
          <div v-else class="network-error">
            Currently, blockchain networks are not connected.
          </div>
          </div>
    
          </div>
        </div>
    </div>
  </template>
  
  <script>
  import { mapGetters } from 'vuex';
  import Web3 from 'web3';
  import CoffeeProductionContract from '../abi/CoffeeProduction.json';
  import StoredRecInfoContract from '../abi/StoredRecInfo.json'; // Import StoredRecInfo ABI
  import coffeeData from '../../public/data/coffee.json';
  import options from '../../public/data/option.json';
  
  export default {
    data() {
      return {
        selectedOption: 'CurrentStock',
        shippingInfo: {
          address: '',
          date: ''
        },
        web3: null,
        accounts: [],
        contract: null,
        productions: [],
        ProductionContractAddress: '0xA93Ce7a8de36b4BcDb0D44fC6Da7a1B864F04d90', // Update with your contract address
        productionIdToTxHash: {},
        StoredRecInfoContract: null,
        StoredRecInfoContractAddress: '0x918251dC459A9B83049da003c267b117CFB745F4', // Update with your contract address
        logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
        coffeeData: coffeeData,
        options: options,
        storedData: [], // To store (timestamp, txHash) pairs from StoredRecInfo
        eventData: {},
        showModal: false,
        selectedTxHash: null,
        isConnected: false,
      };
    },
    computed: {
      ...mapGetters(['getConfirmedProductions']),
      confirmedProductions() {
        return this.getConfirmedProductions;
      }
    },
    methods: {
      formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(price);
      },
      async getStoredData() {
        const userId = this.logedUser.id;
        try {
          const dataEntries = await this.StoredRecInfoContract.methods.getAllStrings().call({ from: this.accounts[userId] });
          this.storedData = [];

          for (let dataEntry of dataEntries) {
            const txHash = dataEntry.txHash;
            const eventData = await this.fetchEventData(txHash);
            if (eventData.status !== 'Rejected') {
              this.storedData.push(dataEntry);
            }
            this.eventData[txHash] = eventData;
          }
        } catch (error) {
          console.error('Error fetching stored data:', error);
        }
      },
      async fetchEventData(txHash) {
        try {
          const receipt = await this.web3.eth.getTransactionReceipt(txHash);
          if (!receipt) {
            alert('Transaction receipt not found');
            return;
          }

          const productionRecordedEventAbi = CoffeeProductionContract.abi.find(
            (item) => item.name === 'ProductionRecorded' && item.type === 'event'
          );

          const eventSignature = this.web3.eth.abi.encodeEventSignature(productionRecordedEventAbi);
          const eventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
          if (!eventLog) {
            alert('ProductionRecorded event not found in transaction logs');
            return;
          }

          const decodedEvent = this.web3.eth.abi.decodeLog(
            productionRecordedEventAbi.inputs,
            eventLog.data,
            eventLog.topics.slice(1)
          );

          return {
            coffeeName: decodedEvent.coffeeName,
            coffeeType: decodedEvent.coffeeType,
            quantity: decodedEvent.quantity,
            timestamp: decodedEvent.timestamp,
            totalPrice: decodedEvent.price,
            origin: decodedEvent.origin,
            status: decodedEvent.status
          };
        } catch (error) {
          console.error('Error fetching event data:', error);
          alert('An error occurred while fetching the event data');
        }
      },
      formatTimestamp(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleString('en-US');
      },
      getAvailableQuantity(coffeeName, type) {
        const product = this.confirmedProductions.find(
          item => item.coffeeName === coffeeName && item.beanType === type
        );
        return product ? product.quantity : '0';
      },
      truncateTxHash(txHash) {
        // Truncate the txHash to display the first and last 6 characters
        return `${txHash.slice(0, 6)}...`;
      },
      showFullTxHash(txHash) {
        this.selectedTxHash = txHash;
        this.showModal = true;
      },
      closeModal() {
        this.showModal = false;
        this.selectedTxHash = null;
      }
    },
    async mounted() {
      try {
        this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
        this.accounts = await this.web3.eth.getAccounts();
        if (this.accounts.length === 0) {
          this.isConnected = false;
        } else {
          this.isConnected = true;
          this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
          this.StoredRecInfoContract = new this.web3.eth.Contract(StoredRecInfoContract.abi, this.StoredRecInfoContractAddress);
          await this.getStoredData();
        }
      } catch (error) {
        console.error('Error connecting to blockchain network:', error);
        this.isConnected = false;
      }
    }
  };
  </script>
  
  <style scoped>
  /* Existing styles */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  th, td {
    border: 1px solid black;
    padding: 8px;
    text-align: center;
    font-size: 12px;
  }
  
  th {
    background-color: #f2f2f2;
  }
  h2 {
    font-family: 'Great Vibes', cursive;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 10vh;
    font-size: 1.3em;
  }
  h3 {
    font-family: 'Times New Roman', Times, serif;
    text-align: center;
    font-size: 1.8em;
    margin-bottom: 20px;
  }
  figure {
    width: 1%;
    position: absolute;
    bottom: 2%;
    size: 10px;
  }
  .content {
    background: #ffc99f;
  }
  .right-side {
    background: #C69B7B;
    padding: 20px;
  }
  .panel-container {
    background-color: white;
    box-shadow: 3px 10px 3px rgba(0, 0, 0, 0.5);
    border-radius: 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40px;
    max-width: 650px;
    margin: 10% auto 2% auto;
  }
  .break-word {
    word-break: break-all;
  }
  .option-selector {
    margin-bottom: 20px;
    float: right;
    margin-right: 160px;
    margin-top: 20px;
  }
  .option-selector select {
    padding: 5px;
    font-size: 16px;
  }
  .network-error {
    color: red;
    margin-top: 10px;
    font-weight: bold;
  }
  </style>
  