<template>
  <section class="left-side"></section>
  <section class="content">
    <aside></aside>
    <section class="right-side">
      <div class="TrackingPage">
        <div class="PageDetails">
          <div>
            <h2>Production and Order Tracking</h2>
            <!-- TxHash 입력 필드 -->
            <h3>Transaction Data</h3>
            <div>
              <input type="text" v-model="txHashInput" placeholder="Transaction Hash" />
              <button @click="fetchEventData">Fetch Blockchain Data</button>
            </div>

            <!-- 이벤트 데이터 표시 -->
            <div v-if="eventData">
              <!-- Production Event Data -->
              <div v-if="eventData.type === 'production'">
                <h4>Production Data</h4>
                <p><strong>Coffee Name:</strong> {{ eventData.coffeeName }}</p>
                <p><strong>Coffee Type:</strong> {{ eventData.coffeeType }}</p>
                <p><strong>Yield (kg):</strong> {{ eventData.quantity }}</p>
                <p><strong>Production Date:</strong> {{ formatTimestamp(Number(eventData.timestamp)) }}</p>
                <p v-if="isSeller || isDistributor || isManager"><strong>Price:</strong> {{ eventData.totalPrice }} ETH</p>
                <p><strong>Producer:</strong> {{ eventData.producer }}</p>
                <p>
                  <strong>Status:</strong>
                  <!-- 상태 텍스트와 색상을 동적으로 바인딩 -->
                  <span :style="{ color: getStatusText(eventData.status).color }">
                    {{ getStatusText(eventData.status).text }}
                  </span>
                </p>
              </div>

              <!-- Order Event Data -->
              <div v-else-if="eventData.type === 'order'">
                <h4>Order Data</h4>
                <p><strong>Coffee Name:</strong> {{ eventData.coffeeName }}</p>
                <p><strong>Bean Type:</strong> {{ eventData.beanType }}</p>
                <p><strong>Quantity:</strong> {{ eventData.quantity }}</p>
                <p><strong>Price:</strong> {{ formatPrice(eventData.price) }}</p>
                <p><strong>Order Date:</strong> {{ formatTimestamp(Number(eventData.timestamp)) }}</p>
                <p><strong>Buyer:</strong> {{ eventData.buyer }}</p>
                <p><strong>Productuion Info:</strong>
                <ul>
                  <li v-for="(txInfo, txIndex) in eventData.TxInfos" :key="txIndex">
                    {{ txIndex + 1 }}.<br>
                    TxHash: {{ txInfo.txHash }}<br>
                    Quantity: {{ txInfo.quantity }}<br>
                    Production date: {{ formatTimestamp(txInfo.timestamp) }}
                  </li>
                </ul></p>
                <p>
                  <strong>Status:</strong>
                  <span :style="{ color: getOrderStatusText(eventData.status).color }">
                    {{ getOrderStatusText(eventData.status).text }}
                  </span>
                </p>
              </div>

              <!-- Unknown Event Data -->
              <div v-else>
                <p>No recognizable event found for this transaction hash.</p>
              </div>
            </div>

            <!-- 저장된 TxHash 목록 표시 -->
            <div>
              <h3>Stored My Transaction Hashes</h3>
              <button @click="getStoredTxHashes">Refresh Stored TxHashes</button>
              <ul>
                <li v-for="(txHash, index) in storedTxHashes" :key="index">
                  {{ formatTimestamp(timestamps[txHash]?.timestamp) }},
                  <span :style="{ color: getStatusText(timestamps[txHash]?.status).color }">
                    {{ getStatusText(timestamps[txHash]?.status).text }}
                  </span>,
                  {{ txHash }}
                </li>
              </ul>
            </div>

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

export default {
  data() {
    return {
      txHashInput: '',
      eventData: null,
      contract: null,
      orderContract: null,
      web3: null,
      ProductionContractAddress: '0x2806B49E0b477a3A26A735B3AC8d78c349F4292F',
      OrderContractAddress: '0xD48f4716fa30a98A5528075A9bB6AFc34c8A8c4C',
      StoredProInfoContractAddress: '0x4DB7c6B838011D72aEAB8809eba59D3bC3D0e6a4',
      StoredProInfoContract: null,
      storedTxHashes: [],
      accounts: [],
      timestamps: {},
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
    };
  },
  methods: {
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
          return { text: 'Approved', color: 'green' };
        case 2:
          return { text: 'Rejected', color: 'red' };
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
          return { text: 'Approved', color: 'green' };
        case 2:
          return { text: 'Rejected', color: 'red' };
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
    this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
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
  },
};
</script>




<style scoped>
h2{
    font-family: 'Great Vibes', cursive;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 10vh;
    font-size: 2.3em;
}
h3{
    border: 1px solid black;
    border-radius: 10px;
    padding: 2%;
    word-break: break-all; /* 긴 단어가 넘칠 경우 줄바꿈 */
    overflow-wrap: break-word; /* 단어가 넘칠 때 줄바꿈 */
}
.content{
    background: #C69B7B;
}
.content > aside{
    background-image: url('../../public/img/blockchain.png');
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    width: 20%;
    aspect-ratio: 1;
    position: absolute;
    left: 5%;
    bottom: 30%;
    rotate: 0deg;
}
.right-side{
    background: #C69B7B;
}
.PageDetails{
    padding-left: 15%;
    padding-right: 8%;
    display: flex;
    flex-direction: column;
    row-gap: 10px;
    z-index: 2;
}

.manageProduct{
    padding: 1%;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer; 
}

.coffeePage{
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
    row-gap: 4em;
}
.text{
    color: black;
    display: flex;
    flex-direction: column;
    align-items: center;
}
aside{
    text-shadow: 2px 2px 5px black;
}
.coffeeImg{
    border-radius: 5px;
}

.toModal{
    padding: 5%;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
}
.toModal:hover{
    background-color: rgb(76, 37, 37);
    color: white;
}
small{
    color: rgb(185, 189, 189);
} 
</style>