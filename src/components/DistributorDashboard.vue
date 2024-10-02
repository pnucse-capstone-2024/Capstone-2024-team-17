<template>
  <div class="content">
    <figure class="left-video"><img src="../../public/img/coffee-beans.png" alt="Coffee Cup"></figure>
    <div class="right-side">
      <h2>Distributor Dashboard</h2>

      <!-- 옵션 선택 박스 -->
      <div class="option-selector">
        <select v-model="selectedOption" id="options">
          <option value="production">Production</option>
          <option value="Order Info">Order Info</option>
        </select>
      </div>

      <!-- 선택된 옵션에 따라 다른 화면 표시 -->
      <div id="panel" class="panel-container">
        <h3 v-if="selectedOption === 'production'">Today's Coffee Production</h3>
        <div v-if="selectedOption === 'production'">
          <div v-if="productions.length > 0">
            <ul>
              <li v-for="(product, index) in productions" :key="index">
                ID: {{ product.productionId }} |
                Coffee: {{ product.coffeeName }} -
                Type: {{ product.coffeeType }} -
                Quantity: {{ product.quantity }}kg -
                **Total Price: {{ (product.totalPrice.toFixed(4))* 0.5 }} ETH** -
                Status: {{ getStatusText(product.status) }}
                <button class="check-btn" @click="handleApproveClick(product)">✅</button>
                <button class="delete-btn" @click="rejectProduction(product.productionId)">❌</button>
              </li>
            </ul>
          </div>
          <div v-else>
            <p>No coffee production data available.</p>
          </div>
          <button class="btn" @click="fetchProductions">Refresh Data</button>
        </div>

        <!-- 배송 정보 입력 화면 -->
        <div v-if="selectedOption === 'Order Info'">
          <h3>Order Information</h3>
          <form @submit.prevent="submitShippingInfo">
            <div>
              <label for="shippingAddress">Shipping Address:</label>
              <input type="text" id="shippingAddress" v-model="shippingInfo.address" />
            </div>
            <div>
              <label for="deliveryDate">Delivery Date:</label>
              <input type="date" id="deliveryDate" v-model="shippingInfo.date" />
            </div>
            <button type="submit" class="btn">Submit Shipping Info</button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from 'web3';
import CoffeeProductionContract from '../abi/CoffeeProduction.json';
import AccountContract from '../abi/AccountContract.json';
import coffeeData from '../../public/data/coffee.json'; // coffee.json 로드
import optionData from '../../public/data/option.json'; // 옵션 데이터 로드

export default {
  data() {
    return {
      selectedOption: 'production',
      shippingInfo: {
        address: '',
        date: ''
      },
      web3: null,
      accounts: [],
      contract: null,
      productions: [],
      ProductionContractAddress: '0xe2Fa463Ffb77eC310f69461361351B59E2A79479',
      productionIdToTxHash: {},
      accountContract: null,
      AccountContractAddress: '0x79Cd64F2D9EF361Af8c96e49C1Be367340dB5ab0',
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      coffeeList: [], // 커피 데이터를 저장할 배열
      options: [], // 타입 수수료 데이터를 저장할 배열
    };
  },
  computed: {
      coffeeProductions() {
        return this.$store.getters.getCoffeeProductions; // Vuex에서 데이터 조회
      }
    },
  methods: {
    bigIntToString(obj) {
      return JSON.parse(
        JSON.stringify(obj, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        )
      );
    },
    async handleApproveClick(product) {
      try {
        // approveProduction 메서드 호출
        await this.approveProduction(product.productionId);
        console.log('approveProduction 완료');

        // 미리 계산된 totalPrice 사용
        const totalPrice = product.totalPrice;
        const halfPrice = totalPrice * 0.5;

        console.log(`Total price: ${totalPrice}, Half price: ${halfPrice}`);

        // 이더로 변환
        const halfPriceInWei = this.web3.utils.toWei(halfPrice.toString(), 'ether');

        // 생산자의 계정 주소 가져오기
        const producerAddress = product.producer;
        if (!producerAddress) {
          console.error('Producer address not found');
          return;
        }

        // 이더 전송
        await this.web3.eth.sendTransaction({
          from: this.accounts[this.logedUser.id], // 유통업자 계정
          to: producerAddress, // 생산자 계정
          value: halfPriceInWei,
        });

        alert(`Sent ${halfPrice} ETH to the producer.`);

        // 재고 업데이트 로직

        // Vuex에서 해당 상품 찾기
        const vueproduct = this.$store.getters.getConfirmedProductions.find(
          (item) => (item.coffeeName === product.coffeeName) && (item.beanType === product.coffeeType)
        );
        console.log('vueproduct:', vueproduct);
        console.log('product.beanType:', product.coffeeType);

        if (vueproduct) {
          // vueproduct.quantity가 BigInt일 수 있으므로 Number로 변환
          const currentQuantity = Number(vueproduct.quantity);
          const newQuantity = currentQuantity + Number(product.quantity);

          console.log('newQuantity:', newQuantity);

          if (newQuantity < 0) {
            alert(`The stock of ${product.coffeeName} (${product.coffeeType}) is insufficient`);
            return;
          }

          // Vuex의 action을 사용하여 재고 수량을 업데이트합니다.
          this.$store.dispatch('updateConfirmedProductionQuantity', {
            coffeeName: product.coffeeName,
            beanType: product.beanType || product.coffeeType,
            newQuantity: newQuantity,
          });
          console.log('updateConfirmedProductionQuantity 완료');
        } else {

          const productData = this.bigIntToString({
            Name: product.coffeeName,
            Type: product.coffeeType,
            Quantity: product.quantity,
          });

          this.$store.commit('addconfirmProduction', productData);
          console.log('addconfirmProduction successfully!');
          //console.warn(`No product found with coffeeName ${product.coffeeName} and beanType ${product.beanType || product.coffeeType}`);
        }

      } catch (error) {
        console.error('Error handling approve click:', error);
        alert('Error handling approve click');
      }
    },
    getStatusText(status) {
      let statusNum;

      // BigNumber와 마찬가지로 BigInt도 처리
      if (typeof status === 'bigint') {
        statusNum = Number(status); // BigInt를 일반 숫자로 변환
      }
      else if (typeof status === 'object' && status.toNumber) {
        statusNum = status.toNumber();
      } else if (typeof status === 'string') {
        if (status.startsWith('0x')) {
          statusNum = parseInt(status, 16);
        } else {
          statusNum = parseInt(status, 10);
        }
      } else if (typeof status === 'number') {
        statusNum = status;
      } else {
        console.warn('알 수 없는 status 형식:', status);
        return 'Unknown';
      }

      switch (statusNum) {
        case 0:
          return 'Registering';
        case 1:
          return 'Approved';
        case 2:
          return 'Rejected';
        default:
          return 'Unknown';
      }
    },
    async fetchProductions() {
      try {
        const count = await this.contract.methods.productionCount().call();
        const productions = [];

        for (let i = 0; i < count; i++) {
          const production = await this.contract.methods.getProduction(i).call();
          const statusNum = Number(production.status);

          if (statusNum === 0) {
            // 총 금액 계산 로직 추가 시작
            const coffeeName = production.coffeeName;
            const beanType = production.coffeeType;
            const quantity = Number(production.quantity);

            // coffeeList에서 해당 커피의 가격 찾기
            const coffeeItem = this.coffeeList.find(item => item.coffeeName === coffeeName);
            if (!coffeeItem) {
              console.error(`Coffee item not found for ${coffeeName}`);
              production.totalPrice = 0;
            } else {
              const price = Number(coffeeItem.price);
              const totalPrice = this.calculateTotalPrice(price, beanType, quantity);
              production.totalPrice = totalPrice;
            }
            // 총 금액 계산 로직 추가 끝

            productions.push({ ...production, productionId: i, status: production.status });
          }
        }

        this.productions = productions;

        // Fetch the ProductionRecorded events
        await this.getProductionEvents();
      } catch (error) {
        console.error('Error fetching productions:', error);
        alert('Error fetching production data');
      }
    },
  async getProductionEvents() {
    try {
      const events = await this.contract.getPastEvents('ProductionRecorded', {
        fromBlock: 0,
        toBlock: 'latest',
      });

      for (const event of events) {
        const productionId = event.returnValues.productionId;
        const txHash = event.transactionHash;
        this.productionIdToTxHash[productionId] = txHash;
      }
    } catch (error) {
      console.error('Error fetching ProductionRecorded events:', error);
    }
  },
  async approveProduction(productionId) {
    try {
      await this.contract.methods.approveProduction(productionId).send({ from: this.accounts[0] });
      alert('Production approved');

      // Remove the approved item from the list
      this.productions = this.productions.filter(product => product.productionId !== productionId);

      // Get the TxHash associated with the productionId
      const txHash = this.productionIdToTxHash[productionId];
      if (txHash) {
        const userId = this.logedUser.id;
        const estimatedGas = await this.accountContract.methods.addString(txHash).estimateGas({ from: this.accounts[userId] });
        await this.accountContract.methods.addString(txHash).send({ from: this.accounts[userId], gas: estimatedGas });
        alert('Transaction hash stored in AccountContract');
      } else {
        console.warn('No txHash found for productionId:', productionId);
      }
    } catch (error) {
      console.error('Error approving production:', error);
      alert('Error approving production');
    }
  },

  async rejectProduction(productionId) {
    try {
      await this.contract.methods.rejectProduction(productionId).send({ from: this.accounts[0] });
      alert('Production rejected');

      // Remove the rejected item from the list
      this.productions = this.productions.filter(product => product.productionId !== productionId);

      // Get the TxHash associated with the productionId
      const txHash = this.productionIdToTxHash[productionId];
      if (txHash) {
        const userId = this.logedUser.id;
        const estimatedGas = await this.accountContract.methods.addString(txHash).estimateGas({ from: this.accounts[userId] });
        await this.accountContract.methods.addString(txHash).send({ from: this.accounts[userId], gas: estimatedGas });
        alert('Transaction hash stored in AccountContract');
      } else {
        console.warn('No txHash found for productionId:', productionId);
      }
    } catch (error) {
      console.error('Error rejecting production:', error);
      alert('Error rejecting production');
    }
  },
  // 타입 수수료 계산 메서드
  calculateOptionFee(feeType) {
      const option = this.options.find(opt => opt.type === feeType);
      return option ? option.fee : 0;
    },
    // 개별 가격 계산 메서드
    calculateEachPrice(price, feeType) {
      const optionFee = this.calculateOptionFee(feeType);
      return price + optionFee;
    },
    // 총 가격 계산 메서드
    calculateTotalPrice(price, feeType, quantity) {
      const eachPrice = this.calculateEachPrice(price, feeType);
      return eachPrice * quantity * 10;
    },
    loadCoffeeData() {
      this.coffeeList = coffeeData; // coffee.json 데이터를 배열에 저장
      console.log('Loaded coffeeList:', this.coffeeList);

      this.options = optionData; // 옵션 데이터를 배열에 저장
      console.log('Loaded options:', this.options);
    },
  submitShippingInfo() {
    alert(`Shipping to ${this.shippingInfo.address} on ${this.shippingInfo.date}`);
    this.shippingInfo.address = '';
    this.shippingInfo.date = '';
  }
},
async mounted() {
  this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
  this.accounts = await this.web3.eth.getAccounts();
  this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
  this.accountContract = new this.web3.eth.Contract(AccountContract.abi, this.AccountContractAddress);
  this.loadCoffeeData();
  await this.fetchProductions();
}
};
</script>



<style scoped>
/* 스타일은 기본 스타일과 동일 */
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
.panel-container {
  background-color: white;
  box-shadow: 3px 10px 3px rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  max-width: 480px;
  margin: 10% auto 2% auto;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  font-size: 18px;
  margin: 10px 0;
}
strong {
  font-size: 22px;
}
.panel-container strong {
  line-height: 25px;
}
.btn {
  background-color: gainsboro;
  color: #000;
  border: 0;
  border-radius: 4px;
  padding: 12px 30px;
  cursor: pointer;
  margin-top: 20px;
}
.btn:focus {
  outline: 0;
}
.btn:active {
  transform: scale(0.98);
}
.btn:hover {
  background: rgb(182, 181, 181);
}
img {
  width: 100%;
  filter: drop-shadow(1px 1px 60px white);
}
figure {
  width: 20%;
  position: absolute;
  left: 5%;
  bottom: 25%;
}
.check-btn {
  background-color: #28a745;
  color: white;
  border: 0;
  border-radius: 5px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;
}
.check-btn:hover {
  background-color: #218838;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: 0;
  border-radius: 5px;
  padding: 5px 10px;
  margin-left: 10px;
  cursor: pointer;
}
.delete-btn:hover {
  background-color: #c82333;
}

/* 옵션 선택 박스 스타일 */
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
</style>
