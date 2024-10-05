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
                **Total Price: {{ product.price }} ETH** -
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
          <div v-if="orders.length > 0">
            <ul>
              <li v-for="(order, index) in orders" :key="index">
                User ID: {{ order.userId }} |
                Ship Address: {{ order.shipAddr }} |
                Ship Tel: {{ order.shipTel }}
                <ul>
                  <li v-for="(item, idx) in order.items" :key="idx">
                    Coffee: {{ item.coffeeName }} -
                    Type: {{ item.bType }} -
                    Amount: {{ item.amount }}
                  </li>
                </ul>
                <button class="check-btn" @click="approveOrder(order)">✅</button>
                <button class="delete-btn" @click="rejectOrder(order)">❌</button>
              </li>
            </ul>
          </div>
          <div v-else>
            <p>No order data available.</p>
          </div>
          <button class="btn" @click="fetchOrders">Refresh Data</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Web3 from 'web3';
import CoffeeProductionContract from '../abi/CoffeeProduction.json';
import StoredRecInfoContract from '../abi/StoredRecInfo.json'; // Import StoredRecInfo ABI
import { mapGetters } from 'vuex';

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
      ProductionContractAddress: '0xA93Ce7a8de36b4BcDb0D44fC6Da7a1B864F04d90', // Update with your contract address
      productionIdToTxHash: {},
      StoredRecInfoContract: null,
      StoredRecInfoContractAddress: '0x918251dC459A9B83049da003c267b117CFB745F4', // Update with your contract address
      logedUser: JSON.parse(sessionStorage.getItem('logeduser'))
    };
  },
  computed: {
    ...mapGetters(['getOrderInfo']),
    orders() {
      // Flatten the orders from all users into a single array
      const allOrders = [];
      const orderInfo = this.$store.state.orderInfo;
      for (const userId in orderInfo) {
          const userOrders = orderInfo[userId];
          userOrders.forEach(order => {
            allOrders.push({
              userId: userId,
              shipAddr: order.shipAddr,
              shipTel: order.shipTel,
              items: order.items,
            });
          });
      }
      return allOrders;
    },
    coffeeProductions() {
        return this.$store.getters.getCoffeeProductions; // Vuex에서 데이터 조회
      }
  },

  methods: {
    async handleApproveClick(product) {
      try {
        // Approve the production
        await this.approveProduction(product.productionId);

        // Use the pre-calculated totalPrice
        const totalPrice = Number(product.price); // Ensure price is a Number
        const halfPrice = totalPrice;

        // Convert to Wei
        const halfPriceInWei = this.web3.utils.toWei(halfPrice.toString(), 'ether');

        // Get producer's account address
        const producerAddress = product.producer;
        if (!producerAddress) {
          console.error('Producer address not found');
          return;
        }

        // Send Ether to producer
        await this.web3.eth.sendTransaction({
          from: this.accounts[this.logedUser.id],
          to: producerAddress,
          value: halfPriceInWei,
        });

        alert(`Sent ${halfPrice} ETH to the producer.`);

        // Get the txHash associated with the productionId
        const txHash = this.productionIdToTxHash[product.productionId];

        // Store the (timestamp, txHash) pair in StoredRecInfo contract
        if (txHash) {
          const userId = this.logedUser.id;
          const estimatedGas = await this.StoredRecInfoContract.methods.addString(txHash).estimateGas({ from: this.accounts[userId] });
          await this.StoredRecInfoContract.methods.addString(txHash).send({ from: this.accounts[userId], gas: estimatedGas });
          alert('Transaction hash stored in StoredRecInfo contract');
        } else {
          console.warn('No txHash found for productionId:');
        }

        // Update confirmedProductions in Vuex store
        const txReceipt = await this.web3.eth.getTransactionReceipt(txHash);
        const block = await this.web3.eth.getBlock(txReceipt.blockNumber);
        const timestamp = block.timestamp;

        const txInfo = {
          txHash: txHash,
          quantity: Number(product.quantity),
          timestamp: Number(timestamp), // Ensure timestamp is a Number
        };

        this.$store.dispatch('addOrUpdateConfirmedProduction', {
          coffeeName: product.coffeeName,
          beanType: product.coffeeType,
          origin: product.origin,
          quantity: Number(product.quantity),
          txInfo: txInfo,
        });

        console.log('Confirmed production updated successfully!');
      } catch (error) {
        console.error('Error handling approve click:', error);
        alert('Error handling approve click');
      }
    },
    getStatusText(status) {
      let statusNum;

      if (typeof status === 'bigint') {
        statusNum = Number(status); // Convert BigInt to Number
      } else if (typeof status === 'object' && status.toNumber) {
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
        console.warn('Unknown status format:', status);
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
      } catch (error) {
        console.error('Error rejecting production:', error);
        alert('Error rejecting production');
      }
    },
  approveOrder() {
    // Empty function
  },
  rejectOrder() {
    // Empty function
  },
  fetchOrders() {
    // Since we're using Vuex, orders are reactive and will update automatically
  },
  },
  async mounted() {
    this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
    this.accounts = await this.web3.eth.getAccounts();
    this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
    this.StoredRecInfoContract = new this.web3.eth.Contract(StoredRecInfoContract.abi, this.StoredRecInfoContractAddress);
    await this.fetchProductions();
  }
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
