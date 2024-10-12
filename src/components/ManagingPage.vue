<template>
  <div class="content">
    <figure class="left-image"><img src="../../public/img/logist.png" alt="Coffee Cup"></figure>
    <div class="right-side">
      <h2>Managing Page</h2>

      <!-- 옵션 선택 박스 -->
      <div class="option-selector">
        <select v-model="selectedOption" id="options">
          <option value="CurrentStock">Current stock</option>
          <option value="ReceivingHistory">Receiving history</option>
          <option value="SalesStatus">Sales history</option>
          <option value="SalesTable">Sales table</option>
        </select>
      </div>

      <!-- 선택된 옵션에 따라 다른 화면 표시 -->
      <div id="panel" class="panel-container">
        
        <!-- Current Stock -->
        <div v-if="selectedOption === 'CurrentStock'">
          <h3>Current Stock <span class="unit">(unit: 100g)</span></h3>
          
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

        <!-- Sales Status (OrderInfo) -->
        <div v-if="selectedOption === 'SalesStatus'">
          <h3>Sales history</h3>
          <div v-if="isConnected">
            <table>
              <thead>
                <tr>
                  <th>Dispatch Date</th>
                  <th>O-date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity(100g)</th>
                  <th>Price</th>
                  <th>TxHash</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(data, txHash) in eventDelData" :key="txHash">
                  <td>{{ formatTimestamp(data.dispatchDate) || 'Unknown' }}</td>
                  <td>{{ formatTimestamp(data.timestamp) || 'Unknown' }}</td>
                  <td>{{ data.coffeeName || 'Unknown' }}</td>
                  <td>{{ data.beanType || 'Unknown' }}</td>
                  <td>{{ data.quantity || 'Unknown' }}</td>
                  <td>{{ formatPrice(data.price) || 'Unknown' }}</td>
                  <td>
                    <!-- Display truncated txHash -->
                    <span @click="showFullTxHash(txHash)" class="txhash-short">
                      <span class="break-word">{{ truncateTxHash(txHash) }}</span>
                    </span>
                    <!-- Full txHash modal -->
                    <div v-if="showModal && selectedTxHash === txHash" class="modal-overlay" @click.self="closeModal">
                      <div class="modal">
                        <h4>Transaction Hash</h4>
                        <p><span class="break-word">{{ txHash }}</span></p>
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

        <!-- Sales Table (SalesTable) -->
        <div v-if="selectedOption === 'SalesTable'">
          <h3>Current ETH(Ξ): {{ userBalance }}</h3>
          <h3>Sales Table</h3>
          <div v-if="isConnected">
            <table>
              <thead>
                <tr>
                  <th>Payment Time</th>
                  <th>Payment Type</th>
                  <th>Coffee Name</th>
                  <th>Coffee Type</th>
                  <th>Amount</th>
                  <th>TxHash</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in paymentRecords" :key="index">
                  <td>{{ formatTimestamp(record.timestamp) }}</td>
                  <td>{{ formatPaymentType(record.paymentType) }}</td>
                  <td>{{ record.coffeeName }}</td>
                  <td>{{ record.coffeeType }}</td>
                  <td v-if="formatPaymentType(record.paymentType) === 'Sell'">+{{ formatAmount(record.amount) }}</td>
                  <td v-if="formatPaymentType(record.paymentType) === 'Buy'">-{{ formatAmount(record.amount) }}</td>
                  <td v-if="formatPaymentType(record.paymentType) === 'Refund'">-{{ formatAmount(record.amount) }}</td>
                  <td>
                    <span @click="showFullTxHash(record.txHash)" class="txhash-short">
                      {{ truncateTxHash(record.txHash) }}
                    </span>
                    <!-- Full txHash modal -->
                    <div v-if="showModal && selectedTxHash === record.txHash" class="modal-overlay" @click.self="closeModal">
                      <div class="modal">
                        <h4>Transaction Hash</h4>
                        <p><span class="break-word">{{ record.txHash }}</span></p>
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
import StoredDelInfoContract from '../abi/StoredDelInfo.json';
import OrderContract from '../abi/OrderContract.json'; // Import OrderContract ABI
import PaymentRecordContract from '../abi/PaymentRecord.json'; // Import ABI

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
      ProductionContractAddress: '0x2806B49E0b477a3A26A735B3AC8d78c349F4292F', // Update with your contract address
      productionIdToTxHash: {},
      StoredRecInfoContract: null,
      StoredRecInfoContractAddress: '0xef5114488A6e51Ae464EF2B415A034Af4b98e612', // Update with your contract address
      StoredDelInfoContract: null,
      StoredDelInfoContractAddress: '0x5AfDcA4FFCD470148680eE79D91984e12199616A', // Update with your contract address
      orderContract: null,
      orderContractAddress: '0xD48f4716fa30a98A5528075A9bB6AFc34c8A8c4C', // Update with your contract address
      storedDelData: [], // To store (timestamp, txHash) pairs from StoredDelInfo
      eventDelData: {},
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      coffeeData: coffeeData,
      options: options,
      storedData: [], // To store (timestamp, txHash) pairs from StoredRecInfo
      eventData: {},
      showModal: false,
      selectedTxHash: null,
      isConnected: false,
      Data: null,
      paymentRecordContract: null,
      paymentRecordAddress: '0xf622eE8c53ff8d0FDdA2B1d35A0CFEA9177F3628', // Replace with actual address
      paymentRecords: [],
    };
  },
  computed: {
    ...mapGetters(['getConfirmedProductions']),
    confirmedProductions() {
      return this.getConfirmedProductions;
    }
  },
  methods: {
    formatPrice(priceInWei) {
      if (!priceInWei) return 'Unknown';
      const priceInEth = this.web3.utils.fromWei(priceInWei.toString(), 'ether');
      return `${parseFloat(priceInEth).toFixed(2)} ETH`;
    },
    async getStoredData() {
      const userId = this.logedUser.id;
      try {
        const dataEntries = await this.StoredRecInfoContract.methods.getAllStrings().call({ from: this.accounts[userId] });
        this.storedData = [];
        console.log("storedRecInfoContarctData: ", dataEntries);
        for (let dataEntry of dataEntries) {
          const txHash = dataEntry.txHash;
          const eventData = await this.fetchEventData(txHash);
          if (eventData.status !== 'Rejected') {
            this.storedData.push(dataEntry);
          }
          this.eventData[txHash] = eventData;
        }
        console.log('event Data:', this.eventData);
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
    async loadUserBalance() {
      try {
        this.accounts = await this.web3.eth.getAccounts();
        if (this.accounts.length === 0) {
          console.error('No accounts found');
          return;
        }
        const userId = this.logedUser.id; // 로그인한 사용자의 ID를 가져옴
        const balance = await this.web3.eth.getBalance(this.accounts[userId]); // 해당 인덱스의 이더리움 잔액 조회
        this.userBalance = parseFloat(this.web3.utils.fromWei(balance, 'ether')).toFixed(2); // 잔액을 ETH로 변환하여 저장
      } catch (error) {
        console.error('Error fetching ETH balance:', error);
      }
    },

    async loadPaymentRecords() {
      try {
        const count = await this.paymentRecordContract.methods.getPaymentCount().call();
        const records = [];

        for (let i = 0; i < count; i++) {
          const payment = await this.paymentRecordContract.methods.getPayment(i).call();
          records.push({
            timestamp: Number(payment[0]),
            paymentType: Number(payment[1]),
            coffeeName: payment[2],
            coffeeType: payment[3],
            amount: payment[4],
            txHash: payment[5],
          });
        }

        this.paymentRecords = records;
      } catch (error) {
        console.error('Error loading payment records:', error);
      }
    },

    formatPaymentType(type) {
      switch (type) {
        case 0:
          return 'Buy';
        case 1:
          return 'Sell';
        case 2:
          return 'Refund';
        default:
          return 'Unknown';
      }
    },

    formatTimestamp(unixTimestamp) {
      const date = new Date(unixTimestamp * 1000);
      return date.toLocaleString('en-US');
    },
    formatAmount(amountInWei) {
      const amountInEth = this.web3.utils.fromWei(amountInWei.toString(), 'ether');
      return `${parseFloat(amountInEth).toFixed(2)} ETH`;
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
    },
    async getStoredDelData() {
    const userId = this.logedUser.id;
    try {
      const dataEntries = await this.StoredDelInfoContract.methods
        .getAllStrings()
        .call({ from: this.accounts[userId] });

      console.log('dataEntries:', dataEntries); // Add this line to check dataEntries

      this.storedDelData = [];
      this.Data = null;

      for (let dataEntry of dataEntries) {
        // Adjust extraction of txHash based on dataEntries structure
        const txHash = dataEntry.txHash; // If dataEntries is an array of txHash strings
        // const txHash = dataEntry.txHash; // If dataEntries is an array of objects
        const datatimestamp = dataEntry.timestamp;
        console.log('dataEntry.txHash', txHash);
        console.log('datatimestamp: ', datatimestamp);

        if (!txHash || typeof txHash !== 'string') {
          console.warn('Invalid txHash:', txHash);
          continue;
        }

        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        if (!receipt) {
          alert('Transaction receipt not found');
          return;
        }

        const orderEvent = await this.decodeOrderEvent(receipt, datatimestamp);
        if (orderEvent) {
          this.Data = { ...orderEvent, type: 'order' };
          console.log('this.Data', this.Data);
        }
        
        this.eventDelData[txHash] = this.Data;
        
      }
      console.log('this.eventDelData:', this.eventDelData);
    } catch (error) {
      console.error('Error fetching stored delivery data:', error);
    }
  },
  async decodeOrderEvent(receipt, datatimestamp) {
      try {
        const orderCreatedEventAbi = OrderContract.abi.find(
          (item) => item.name === 'OrderCreated' && item.type === 'event'
        );

        const eventSignature = this.web3.eth.abi.encodeEventSignature(orderCreatedEventAbi);

        const eventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
        if (!eventLog) {
          return null;
        }

        const decodedEvent = this.web3.eth.abi.decodeLog(
          orderCreatedEventAbi.inputs,
          eventLog.data,
          eventLog.topics.slice(1)
        );

        const orderId = decodedEvent.orderId;

        // Fetch the order data using orderId
        const orderData = await this.orderContract.methods.getOrder(orderId).call();

        const block = await this.web3.eth.getBlock(receipt.blockNumber);
        const timestamp = Number(block.timestamp);

        return {
          coffeeName: orderData[1],
          beanType: orderData[2],
          quantity: Number(orderData[3]),
          price: orderData[4],
          buyer: orderData[5],
          status: Number(orderData[6]),
          timestamp: timestamp,
          dispatchDate: Number(datatimestamp)
        };
      } catch (error) {
        console.error('Error decoding order event:', error);
        return null;
      }
    },

  async fetchOrderEventData(txHash) {
    try {
      if (!txHash || typeof txHash !== 'string') {
        console.error('Invalid txHash:', txHash);
        return null;
      }

      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      if (!receipt) {
        console.warn('Transaction receipt not found for txHash:', txHash);
        return null;
      }

      // Find the OrderApproved event in the transaction logs
      const orderApprovedEventAbi = OrderContract.abi.find(
        (item) => item.name === 'OrderApproved' && item.type === 'event'
      );

      const eventSignature = this.web3.eth.abi.encodeEventSignature(orderApprovedEventAbi);
      const eventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
      if (!eventLog) {
        console.warn('OrderApproved event not found in transaction logs for txHash:', txHash);
        return null;
      }

      // Since there are no indexed parameters, pass empty array for topics
      const decodedEvent = this.web3.eth.abi.decodeLog(
        orderApprovedEventAbi.inputs,
        eventLog.data,
        []
      );

      const orderId = decodedEvent.orderId;
      if (!orderId) {
        console.warn('OrderId not found in decoded event for txHash:', txHash);
        return null;
      }

      // Get order details using orderId
      const orderData = await this.orderContract.methods.getOrder(orderId).call();

      // Get the Dispatch Date from the block timestamp
      const dispatchBlock = await this.web3.eth.getBlock(receipt.blockNumber);
      const dispatchDate = dispatchBlock.timestamp;

      // Fetch all OrderCreated events
      const orderCreatedEvents = await this.orderContract.getPastEvents('OrderCreated', {
        fromBlock: 0,
        toBlock: 'latest',
      });

      // Find the event with the matching orderId
      let orderDate;
      for (let event of orderCreatedEvents) {
        if (event.returnValues.orderId === orderId.toString()) {
          const orderCreatedReceipt = await this.web3.eth.getTransactionReceipt(event.transactionHash);
          const orderCreatedBlock = await this.web3.eth.getBlock(orderCreatedReceipt.blockNumber);
          orderDate = orderCreatedBlock.timestamp;
          break;
        }
      }

      if (!orderDate) {
        console.warn('OrderCreated event not found for orderId:', orderId);
        orderDate = null;
      }

      return {
        coffeeName: orderData[1],
        beanType: orderData[2],
        quantity: Number(orderData[3]),
        price: orderData[4],
        dispatchDate: dispatchDate,
        orderDate: orderDate,
      };
    } catch (error) {
      console.error('Error fetching order event data:', error);
      return null;
    }
  },

  },
  async mounted() {
    try {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
      await this.loadUserBalance(); // 로그인한 사용자의 잔액을 로드
      this.accounts = await this.web3.eth.getAccounts();
      if (this.accounts.length === 0) {
        this.isConnected = false;
      } else {
        this.isConnected = true;
        this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
        this.StoredRecInfoContract = new this.web3.eth.Contract(StoredRecInfoContract.abi, this.StoredRecInfoContractAddress);
        await this.getStoredData();
      }
      // Initialize StoredDelInfoContract
      this.StoredDelInfoContract = new this.web3.eth.Contract(
        StoredDelInfoContract.abi,
        this.StoredDelInfoContractAddress
      );
      // Initialize OrderContract
      this.orderContract = new this.web3.eth.Contract(
        OrderContract.abi,
        this.orderContractAddress
      );

      this.paymentRecordContract = new this.web3.eth.Contract(
        PaymentRecordContract.abi,
        this.paymentRecordAddress
      );

      // Load payment records
      await this.loadPaymentRecords();

      // Fetch stored delivery data
      await this.getStoredDelData();
      } catch (error) {
        console.error('Error connecting to blockchain network:', error);
        this.isConnected = false;
      }
    }
};
</script>

<style scoped>
/* Existing styles */
.left-image {
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  width: 15%;
  aspect-ratio: 1;
  position: absolute;
  left: 5%;
  bottom: 25%;
}
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
  font-size: 2.3em;
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
.unit {
  font-family: 'Times New Roman', Times, serif;
  margin-left: 5px;
  font-size: 0.8em;
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