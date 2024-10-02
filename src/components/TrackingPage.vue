<template>
    <section class="left-side"></section>
    <section class="content">
      <aside></aside>
      <section class="right-side">
        <div class="TrackingPage">
          <div class="PageDetails">
            <div>
              <h2>Production Tracking</h2>
              <!-- TxHash 입력 필드 -->
              <div>
                <input type="text" v-model="txHashInput" placeholder="Transaction Hash" />
                <button @click="fetchEventData">Fetch Blockchain Data</button>
              </div>
  
              <!-- 이벤트 데이터 표시 -->
              <div v-if="eventData">
                <h3>Transaction {{ txHashInput }} Production Data</h3>
                <p><strong>Coffee Origin:</strong> {{ eventData.coffeeName }}</p>
                <p><strong>Coffee Type:</strong> {{ eventData.coffeeType }}</p>
                <p><strong>Yield (kg):</strong> {{ eventData.quantity }}</p>
                <p><strong>Production Date:</strong> {{ formatTimestamp(Number(eventData.timestamp)) }}</p>
                <p><strong>Producer:</strong> {{ eventData.producer }}</p>
                <p>
                  <strong>Status:</strong> 
                  <!-- 상태 텍스트와 색상을 동적으로 바인딩 -->
                  <span :style="{ color: getStatusText(eventData.status).color }">
                    {{ getStatusText(eventData.status).text }}
                  </span>
                </p>
              </div>
  
              <!-- 저장된 TxHash 목록 표시 -->
              <div>
                <h3>Stored My Transaction Hashes</h3>
                <button @click="getStoredTxHashes">Refresh Stored TxHashes</button>
                <ul>
                  <li v-for="(txHash, index) in storedTxHashes" :key="index">{{ formatTimestamp(timestamps[txHash].timestamp) }},
                    <span :style="{ color: getStatusText(timestamps[txHash].status).color }">
                      {{ getStatusText(timestamps[txHash].status).text }}
                    </span>, {{ txHash }}</li>
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
  import AccountContract from '../abi/AccountContract.json';
  
  export default {
    data() {
      return {
        txHashInput: '',
        eventData: null,
        contract: null,
        web3: null,
        ProductionContractAddress: '0xe2Fa463Ffb77eC310f69461361351B59E2A79479',
        AccountContractAddress: '0x79Cd64F2D9EF361Af8c96e49C1Be367340dB5ab0',
        accountContract: null,
        storedTxHashes: [],
        accounts: [],
        timestamps: {},
        logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      };
    },
    methods: {
      async fetchProductionStatus(txHash) {
    try {
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      if (!receipt) {
        console.error('Transaction receipt not found');
        return 'Unknown';
      }
  
      const productionRecordedEventAbi = CoffeeProductionContract.abi.find(
        (item) => item.name === 'ProductionRecorded' && item.type === 'event'
      );
  
      const eventSignature = this.web3.eth.abi.encodeEventSignature(productionRecordedEventAbi);
      const eventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
      if (!eventLog) {
        console.error('ProductionRecorded event not found in transaction logs');
        return 'Unknown';
      }
  
      const decodedEvent = this.web3.eth.abi.decodeLog(
        productionRecordedEventAbi.inputs,
        eventLog.data,
        eventLog.topics.slice(1)
      );
  
      const productionId = decodedEvent.productionId;
      const production = await this.contract.methods.getProduction(productionId).call();
      
      return production.status;
    } catch (error) {
      console.error('Error fetching production status:', error);
      return 'Unknown';
    }
  }
  ,
      formatTimestamp(unixTimestamp) {
        const date = new Date(unixTimestamp * 1000);
        return date.toLocaleString('en-US');
      },
      getStatusText(status) {
        let statusNum;
  
        if (typeof status === 'bigint') {
          statusNum = Number(status); // BigInt를 일반 숫자로 변환
        }
  
        switch (statusNum) {
          case 0:
            return { text: 'Registering', color: 'black' }; // 기본 색상
          case 1:
            return { text: 'Approved', color: 'green' }; // 초록색
          case 2:
            return { text: 'Rejected', color: 'red' }; // 빨간색
          default:
            return { text: 'Unknown', color: 'gray' }; // 기본 색상
        }
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
  
          // Find the ProductionRecorded event in the transaction logs
          const productionRecordedEventAbi = CoffeeProductionContract.abi.find(
            (item) => item.name === 'ProductionRecorded' && item.type === 'event'
          );
  
          const eventSignature = this.web3.eth.abi.encodeEventSignature(productionRecordedEventAbi);
  
          const eventLog = receipt.logs.find((log) => log.topics[0] === eventSignature);
          if (!eventLog) {
            alert('ProductionRecorded event not found in transaction logs');
            return;
          }
  
          // Decode the event log to get the productionId
          const decodedEvent = this.web3.eth.abi.decodeLog(
            productionRecordedEventAbi.inputs,
            eventLog.data,
            eventLog.topics.slice(1)
          );
  
          const productionId = decodedEvent.productionId;
  
          // Fetch the production data using productionId
          const production = await this.contract.methods.getProduction(productionId).call();
          console.log('production.status:', production.status);
  
          this.eventData = {
            coffeeName: production.coffeeName,
            coffeeType: production.coffeeType,
            quantity: production.quantity,
            timestamp: production.timestamp,
            producer: production.producer,
            status: production.status,
          };
  
        } catch (error) {
          console.error('Error fetching event data:', error);
          alert('An error occurred while fetching the event data');
        }
      },
      async fetchBlockTimestamp(txHash) {
    try {
      const transaction = await this.web3.eth.getTransaction(txHash);
      if (!transaction) {
        alert('Transaction not found');
        return;
      }
  
      const block = await this.web3.eth.getBlock(transaction.blockNumber);
      if (!block) {
        alert('Block not found');
        return;
      }
  
      const timestamp = Number(block.timestamp); // 타임스탬프를 Number로 변환
      console.log('Block Timestamp:', timestamp);
  
      // Vue 3에서는 객체에 동적으로 값을 추가해도 반응형이 유지됨
      this.timestamps[txHash] = timestamp; // 직접 할당
  
      return timestamp;
    } catch (error) {
      console.error('Error fetching block timestamp:', error);
      alert('An error occurred while fetching the block timestamp');
    }
  }
  ,
  async getStoredTxHashes() {
    const userId = this.logedUser.id;
    try {
      const txHashes = await this.accountContract.methods.getAllStrings().call({ from: this.accounts[userId] });
      this.storedTxHashes = txHashes;
  
      // 각 해시의 타임스탬프와 상태를 가져옴
      for (let txHash of txHashes) {
        const timestamp = await this.fetchBlockTimestamp(txHash);
        const status = await this.fetchProductionStatus(txHash); // 상태 값을 가져옴
        this.timestamps[txHash] = { timestamp, status }; // 타임스탬프와 상태를 저장
      }
    } catch (error) {
      console.error('Error fetching stored TxHashes:', error);
    }
  },
    },
    
    async mounted() {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
      this.accounts = await this.web3.eth.getAccounts();
      this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
      this.accountContract = new this.web3.eth.Contract(AccountContract.abi, this.AccountContractAddress);
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