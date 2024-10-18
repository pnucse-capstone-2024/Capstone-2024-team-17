<template>
  <section class="left-side"></section>
  <section class="content">
    <aside></aside>
    <section class="right-side">
      <div class="TrackingPage">
        <div class="PageDetails">
          <div>
            <h2>Production and Order Tracking</h2>

            <!-- Event Data Display -->
            <div v-if="eventData" class="panel-container">
              <h3>Transaction Data</h3>

              <div v-if="eventData">
                <!-- Production Event Data -->
                <div v-if="eventData.type === 'production'">
                  <h4>Production Data</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Coffee Name</strong></td>
                        <td>{{ eventData.coffeeName }}</td>
                      </tr>
                      <tr>
                        <td><strong>Coffee Type</strong></td>
                        <td>{{ eventData.coffeeType }}</td>
                      </tr>
                      <tr>
                        <td><strong>Yield (kg)</strong></td>
                        <td>{{ eventData.quantity }}</td>
                      </tr>
                      <tr>
                        <td><strong>Production Date</strong></td>
                        <td>{{ formatTimestamp(Number(eventData.timestamp)) }}</td>
                      </tr>
                      <tr v-if="isSeller || isDistributor || isManager">
                        <td><strong>Price</strong></td>
                        <td>{{ eventData.totalPrice }} ETH</td>
                      </tr>
                      <tr>
                        <td><strong>Producer</strong></td>
                        <td>{{ eventData.producer }}</td>
                      </tr>
                      <tr>
                        <td><strong>Status</strong></td>
                        <td>
                          <span :style="{ color: getStatusText(eventData.status).color }">
                            {{ getStatusText(eventData.status).text }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Order Event Data -->
                <div v-else-if="eventData.type === 'order'">
                  <h4>Order Data</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Coffee Name</strong></td>
                        <td>{{ eventData.coffeeName }}</td>
                      </tr>
                      <tr>
                        <td><strong>Bean Type</strong></td>
                        <td>{{ eventData.beanType }}</td>
                      </tr>
                      <tr>
                        <td><strong>Quantity</strong></td>
                        <td>{{ eventData.quantity }}</td>
                      </tr>
                      <tr>
                        <td><strong>Price</strong></td>
                        <td>{{ formatPrice(eventData.price) }}</td>
                      </tr>
                      <tr>
                        <td><strong>Order Date</strong></td>
                        <td>{{ formatTimestamp(Number(eventData.timestamp)) }}</td>
                      </tr>
                      <tr>
                        <td><strong>Buyer</strong></td>
                        <td>{{ eventData.buyer }}</td>
                      </tr>
                      <tr>
                        <td><strong>Status</strong></td>
                        <td>
                          <span :style="{ color: getOrderStatusText(eventData.status).color }">
                            {{ getOrderStatusText(eventData.status).text }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <br>
                  <!-- Production Info Tables -->
                  <div v-for="(txInfo, txIndex) in eventData.TxInfos" :key="txIndex">
                    <h5>Production Info {{ txIndex + 1 }}</h5>
                    <table>
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>TxHash</strong></td>
                          <td>
                            <span @click="fetchProductionEventData(txInfo.txHash)" class="clickable">
                              {{ txInfo.txHash }}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Quantity</strong></td>
                          <td>{{ txInfo.quantity }}</td>
                        </tr>
                        <tr>
                          <td><strong>Production Date</strong></td>
                          <td>{{ formatTimestamp(txInfo.timestamp) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Unknown Event Data -->
                <div v-else>
                  <p>No recognizable event found for this transaction.</p>
                </div>
              </div>
            </div>

            <!-- Stored Transactions List -->
            <div>
              <h3 style="margin-top: 50px;">Stored My Transaction Data</h3>
              <button class="fetchStoredButton" @click="getStoredTxHashes">Refresh Stored Transactions</button>
              <ul class="StoredTransactionList">
                <li v-for="(txHash, index) in storedTxHashes" :key="index">
                  {{ formatTimestamp(timestamps[txHash]?.timestamp) }},
                  <span :style="{ color: getStatusText(timestamps[txHash]?.status).color }">
                    {{ getStatusText(timestamps[txHash]?.status).text }}
                  </span><br>
                  <span @click="selectTransaction(txHash)" class="clickable">{{ 'Order ' + (index + 1) }}</span>,
                  <!-- Shipping Info Button remains the same -->
                  <button
                    class="getShippingInfoButton"
                    v-if="(getStatusText(timestamps[txHash]?.status).text === 'Approved for 1st distributor (CoffeeAndCom)') && (!isSeller)"
                    @click="openShippingInfoModal(txHash)"
                  >
                    <i class="fas fa-shipping-fast"></i> Shipping Info
                  </button>
                </li>
              </ul>
              <!-- Network Connection Status -->
              <p v-if="!isConnected" class="network-error">
                Blockchain network is not connected.
              </p>
            </div>

            <!-- ShippingInfoModal Component -->
            <ShippingInfoModal
              v-if="isShippingInfoModalOpen"
              :trackingNumber="selectedTxHash"
              :initialShippingData="selectedShippingData"
              @close="isShippingInfoModalOpen = false"
            />
          </div>
        </div>
      </div>
    </section>
  </section>
</template>


<script>
import Web3 from 'web3';
import CoffeeProductionContract from '../abi/CoffeeProduction.json';
import StoredProInfoContract from '../abi/StoredProInfo.json';
import OrderContract from '../abi/OrderContract.json';
import ShippingInfoModal from './ShippingInfoCompo.vue';
import { mapGetters} from 'vuex';

export default {
  components: {
    ShippingInfoModal,
  },

  data() {
    return {
      // Remove txHashInput
      // txHashInput: '',
      eventData: null,
      contract: null,
      orderContract: null,
      web3: null,
      ProductionContractAddress: '0x2806B49E0b477a3A26A735B3AC8d78c349F4292F',
      OrderContractAddress: '0xD48f4716fa30a98A5528075A9bB6AFc34c8A8c4C',
      StoredProInfoContractAddress: '0x140570EaF26cc9D37Db7a6Ea3A9ABEea15093B65',
      StoredProInfoContract: null,
      storedTxHashes: [],
      accounts: [],
      timestamps: {},
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      isShippingInfoModalOpen: false,
      selectedTxHash: '',
      selectedShippingData: null,
      isConnected: true, // Blockchain connection status
    };
  },
  computed: {
    ...mapGetters(['getShippingInfo']),
  },
  methods: {
    openShippingInfoModal(txHash) {
      this.selectedTxHash = txHash;
      this.selectedShippingData = this.getShippingInfo(txHash) || {
        status: '',
        estimatedDelivery: '',
        currentLocation: '',
      };
      this.isShippingInfoModalOpen = true;
    },
    formatPrice(priceInWei) {
      if (!priceInWei) return 'Unknown';
      const priceInEth = this.web3.utils.fromWei(priceInWei.toString(), 'ether');
      return `${parseFloat(priceInEth).toFixed(2)} ETH`;
    },
    async fetchEventData() {
      if (!this.txHashInput) {
        alert('Please enter a Transaction Hash');
        return;
      }
      try {
        const receipt = await this.web3.eth.getTransactionReceipt(this.txHashInput);
        if (!receipt) {
          alert('Transaction receipt not found');
          return;
        }

        // Try to decode ProductionRecorded event
        const productionEvent = await this.decodeProductionEvent(receipt);
        if (productionEvent) {
          this.eventData = { ...productionEvent, type: 'production' };
          return;
        }

        // Try to decode OrderCreated event
        const orderEvent = await this.decodeOrderEvent(receipt);
        if (orderEvent) {
          this.eventData = { ...orderEvent, type: 'order' };
          return;
        }

        // If no known event is found
        this.eventData = { type: 'unknown' };
      } catch (error) {
        console.error('Error fetching event data:', error);
        alert('An error occurred while fetching the event data');
      }
    },
    async fetchProductionEventData(txHash) {
      try {
        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        if (!receipt) {
          alert('Transaction receipt not found');
          return;
        }

        const productionEvent = await this.decodeProductionEvent(receipt);
        if (productionEvent) {
          this.eventData = { ...productionEvent, type: 'production' };
          return;
        }

        // If no production event is found
        alert('No production event found for this transaction hash');
      } catch (error) {
        console.error('Error fetching production event data:', error);
        alert('An error occurred while fetching the production event data');
      }
    },
    async decodeProductionEvent(receipt) {
      try {
        const productionRecordedEventAbi = CoffeeProductionContract.abi.find(
          (item) => item.name === 'ProductionRecorded' && item.type === 'event'
        );

        const eventSignature = this.web3.eth.abi.encodeEventSignature(productionRecordedEventAbi);

        const eventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
        if (!eventLog) {
          return null;
        }

        const decodedEvent = this.web3.eth.abi.decodeLog(
          productionRecordedEventAbi.inputs,
          eventLog.data,
          eventLog.topics.slice(1)
        );

        const productionId = decodedEvent.productionId;

        // Fetch the production data using productionId
        const production = await this.contract.methods.getProduction(productionId).call();

        return {
          coffeeName: production.coffeeName,
          coffeeType: production.coffeeType,
          quantity: production.quantity,
          timestamp: production.timestamp,
          totalPrice: production.price,
          producer: production.producer,
          status: production.status,
        };
      } catch (error) {
        console.error('Error decoding production event:', error);
        return null;
      }
    },
    async selectTransaction(txHash) {
      try {
        const receipt = await this.web3.eth.getTransactionReceipt(txHash);
        if (!receipt) {
          alert('Transaction receipt not found');
          return;
        }

        // Try to decode ProductionRecorded event
        const productionEvent = await this.decodeProductionEvent(receipt);
        if (productionEvent) {
          this.eventData = { ...productionEvent, type: 'production' };
          return;
        }

        // Try to decode OrderCreated event
        const orderEvent = await this.decodeOrderEvent(receipt);
        if (orderEvent) {
          this.eventData = { ...orderEvent, type: 'order' };
          return;
        }

        // If no known event is found
        this.eventData = { type: 'unknown' };
      } catch (error) {
        console.error('Error fetching event data:', error);
        alert('An error occurred while fetching the event data');
      }
    },
    async decodeOrderEvent(receipt) {
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

        const txHashes = orderData[7];
        const txQuantities = orderData[8];
        const txTimestamps = orderData[9];

        const txInfos = [];
            for (let j = 0; j < txHashes.length; j++) {
              txInfos.push({
                txHash: txHashes[j],
                quantity: Number(txQuantities[j]), // Convert BigInt to Number
                timestamp: Number(txTimestamps[j]), // Convert BigInt to Number
              });
            }

        return {
          coffeeName: orderData[1],
          beanType: orderData[2],
          quantity: Number(orderData[3]),
          price: orderData[4],
          buyer: orderData[5],
          status: Number(orderData[6]),
          timestamp: timestamp,
          TxInfos: txInfos
        };
      } catch (error) {
        console.error('Error decoding order event:', error);
        return null;
      }
    },
    getStatusText(status) {
      if (status === undefined || status === null) {
        return { text: 'Unknown', color: 'gray' };
      }
      let statusNum = Number(status);

      switch (statusNum) {
        case 0:
          return { text: 'Registering', color: 'black' };
        case 1:
          return { text: 'Approved for 1st distributor (CoffeeAndCom)', color: 'green' };
        case 2:
          return { text: 'Rejected for 1st distributor (CoffeeAndCom)', color: 'red' };
        default:
          return { text: 'Unknown', color: 'gray' };
      }
    },
    getOrderStatusText(status) {
      if (status === undefined || status === null) {
        return { text: 'Unknown', color: 'gray' };
      }
      let statusNum = Number(status);

      switch (statusNum) {
        case 0:
          return { text: 'Registering', color: 'black' };
        case 1:
          return { text: 'Approved for 1st distributor(CoffeeAndCom)', color: 'green' };
        case 2:
          return { text: 'Rejected for 1st distributor(CoffeeAndCom)', color: 'red' };
        default:
          return { text: 'Unknown', color: 'gray' };
      }
    },
    formatTimestamp(unixTimestamp) {
      if (!unixTimestamp) return 'Unknown';
      const date = new Date(unixTimestamp * 1000);
      return date.toLocaleString('en-US');
    },
    async getStoredTxHashes() {
      const userId = this.logedUser.id;
      try {
        const txHashes = await this.StoredProInfoContract.methods
          .getAllStrings()
          .call({ from: this.accounts[userId] });
        this.storedTxHashes = txHashes;

        // Fetch timestamps and statuses for each txHash
        for (let txHash of txHashes) {
          const receipt = await this.web3.eth.getTransactionReceipt(txHash);
          if (!receipt) continue;

          const block = await this.web3.eth.getBlock(receipt.blockNumber);
          const timestamp = Number(block.timestamp);

          // Try to decode production event
          let status;
          const productionEvent = await this.decodeProductionEvent(receipt);
          if (productionEvent) {
            status = productionEvent.status;
          } else {
            // Try to decode order event
            const orderEvent = await this.decodeOrderEvent(receipt);
            if (orderEvent) {
              status = orderEvent.status;
            } else {
              status = 'Unknown';
            }
          }

          this.timestamps[txHash] = { timestamp, status };
        }
      } catch (error) {
        console.error('Error fetching stored TxHashes:', error);
      }
    },
  },
  async mounted() {
    try {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

      // Check network connection
      const isConnected = await this.web3.eth.net.isListening();
      this.isConnected = isConnected;

      if (!isConnected) {
        this.isConnected = false;
        return;
      }

      this.isSeller = this.logedUser.seller;
      this.isManager = this.logedUser.manager;
      this.isDistributor = this.logedUser.distributor;
      this.accounts = await this.web3.eth.getAccounts();
      this.contract = new this.web3.eth.Contract(
        CoffeeProductionContract.abi,
        this.ProductionContractAddress
      );
      this.orderContract = new this.web3.eth.Contract(
        OrderContract.abi,
        this.OrderContractAddress
      );
      this.StoredProInfoContract = new this.web3.eth.Contract(
        StoredProInfoContract.abi,
        this.StoredProInfoContractAddress
      );

      await this.getStoredTxHashes();
    } catch (error) {
      console.error('Blockchain network connection error:', error);
      this.isConnected = false;
    }
  },
};
</script>




<style scoped>
/* Existing styles */
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

.content {
  background: #ffc99f;
}

.right-side {
  background: #C69B7B;
  padding: 20px;
}

/* Adjusted .panel-container to prevent content from being pushed down */
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
  margin: 2% auto; /* Reduced top margin */
}

/* Added .PageDetails class to manage content layout */
.PageDetails {
  padding-left: 15%;
  padding-right: 8%;
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  z-index: 2;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  border: 1px solid black;
  padding: 8px;
  text-align: center;
  font-size: 12px;
}

th {
  background-color: #f2f2f2;
}

.break-word {
  word-break: break-all;
}

.network-error {
  color: red;
  margin-top: 10px;
  font-weight: bold;
}

/* Style for clickable items */
.clickable {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}

/* Styles for buttons */
.fetchStoredButton {
  padding: 1%;
  font-weight: 700;
  border-radius: 8px;
  margin-top: 10px;
  cursor: pointer; 
}

.getShippingInfoButton {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, transform 0.2s;
  font-size: 16px;
}

.getShippingInfoButton:hover {
  background-color: #45a049;
  transform: scale(0.95);
}

.getShippingInfoButton:active {
  background-color: #3e8e41;
  transform: scale(0.98);
}

.getShippingInfoButton:disabled {
  background-color: #a5a5a5;
  cursor: not-allowed;
}

/* Icon inside the shipping info button */
.getShippingInfoButton i {
  margin-right: 8px;
}
</style>
