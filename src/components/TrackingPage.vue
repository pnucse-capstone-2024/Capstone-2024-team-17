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
              <input class="txInput" type="text" v-model="txHashInput" placeholder="Transaction Hash" />
              <button class="fetchButton" @click="fetchEventData">Fetch Blockchain Data</button>
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
              <h3 style="margin-top: 50px;">Stored My Transaction Hashes</h3>
              <button class="fetchStoredButton" @click="getStoredTxHashes">Refresh Stored TxHashes</button>
              <ul>
                <li v-for="(txHash, index) in storedTxHashes" :key="index">
                  {{ formatTimestamp(timestamps[txHash]?.timestamp) }},
                  <span :style="{ color: getStatusText(timestamps[txHash]?.status).color }">
                    {{ getStatusText(timestamps[txHash]?.status).text }}
                  </span>
                  {{ txHash }}
                  <button
                    class="getShippingInfoButton"
                    v-if="(getStatusText(timestamps[txHash]?.status).text === 'Approved') && (!isSeller)"
                    @click="openShippingInfoModal(txHash)"
                  >
                    <i class="fas fa-shipping-fast"></i> Shipping Info
                  </button>
                </li>
              </ul>

              <!-- 네트워크 연결 상태에 따라 문구 표시 -->
              <p v-if="!isConnected" style="color: red; font-weight: bold;">
                Blockchain network is not connected.
              </p>
            </div>

            <!-- ShippingInfoModal 컴포넌트 -->
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
      txHashInput: '',
      eventData: null,
      contract: null,
      orderContract: null,
      web3: null,
      ProductionContractAddress: '0x2806B49E0b477a3A26A735B3AC8d78c349F4292F',
      OrderContractAddress: '0xD48f4716fa30a98A5528075A9bB6AFc34c8A8c4C',
      StoredProInfoContractAddress: '0x25A691E1e85a40420e95BCC3415e562Ec68d4497',
      StoredProInfoContract: null,
      storedTxHashes: [],
      accounts: [],
      timestamps: {},
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      isShippingInfoModalOpen: false,
      selectedTxHash: '',
      selectedShippingData: null,
      isConnected: true, // 블록체인 연결 상태 변수 추가
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
    try {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));

      // 네트워크가 연결되어 있는지 확인
      const isConnected = await this.web3.eth.net.isListening();
      this.isConnected = isConnected; // 연결 상태 업데이트

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
      console.error('블록체인 네트워크 연결 오류:', error);
      this.isConnected = false; // 네트워크 연결 실패 시 false로 설정
    }
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
.fetchButton {
  padding: 1%;
  font-weight: 700;
  border-radius: 8px;
  margin-top: 10px;
  margin-left: 10px;
  cursor: pointer; 
}
.fetchStoredButton{
  padding: 1%;
  font-weight: 700;
  border-radius: 8px;
  margin-top: 10px;
  cursor: pointer; 
}
.getShippingInfoButton {
  padding: 0.1%;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer; 
}
.txInput {
  padding: 10px;
  width: 300px; /* 입력 필드 너비 */
  border: 1px solid #1b1b1b; /* 테두리 색상 */
  border-radius: 5px;
  margin-top: 10px; /* 위와의 간격 */
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1); /* 입력 필드 그림자 */
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
.getShippingInfoButton {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px; /* 패딩을 늘려 버튼 크기를 키움 */
  font-weight: 600; /* 글씨 두께를 증가시켜 강조 */
  border-radius: 8px; /* 모서리를 둥글게 */
  cursor: pointer; /* 커서를 포인터로 변경 */
  background-color: #4CAF50; /* 녹색 배경 */
  color: white; /* 흰색 텍스트 */
  border: none; /* 기본 테두리 제거 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 약간의 그림자 추가 */
  transition: background-color 0.3s ease, transform 0.2s; /* 부드러운 전환 효과 */
  font-size: 16px; /* 텍스트 크기 조정 */
}

.getShippingInfoButton:hover {
  background-color: #45a049; /* 호버 시 더 진한 녹색 */
  transform: scale(0.85); /* 약간 확대 */
}

.getShippingInfoButton:active {
  background-color: #3e8e41; /* 클릭 시 더 진한 녹색 */
  transform: scale(0.98); /* 클릭 시 약간 축소 */
}

.getShippingInfoButton:disabled {
  background-color: #a5a5a5; /* 비활성화 시 회색 배경 */
  cursor: not-allowed; /* 비활성화 시 커서 변경 */
}

/* 아이콘 추가를 위한 스타일 */
.getShippingInfoButton i {
  margin-right: 8px; /* 아이콘과 텍스트 사이 간격 */
}

</style>