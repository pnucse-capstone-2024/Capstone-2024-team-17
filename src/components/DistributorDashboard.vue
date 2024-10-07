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
              Order ID: {{ order.orderId }} |
              Coffee: {{ order.coffeeName }} -
              Type: {{ order.beanType }} -
              Quantity: {{ order.quantity }} -
              Price: {{ formatPrice(order.price) }} ETH -
              Buyer: {{ order.buyer }} -
              Status: {{ getStatusText(order.status) }}
              <!-- Display txInfo -->
              <!-- <div>
                <h4>Production Details:</h4>
                <ul>
                  <li v-for="(txInfo, txIndex) in order.txInfos" :key="txIndex">
                    TxHash: {{ txInfo.txHash }} |
                    Quantity: {{ txInfo.quantity }} |
                    Timestamp: {{ formatTimestamp(txInfo.timestamp) }}
                  </li>
                </ul>
              </div> -->
              <button class="check-btn" @click="handleApproveOrder(order.orderId)">✅</button>
              <button class="delete-btn" @click="handleRejectOrder(order)">❌</button>
            </li>
          </ul>
        </div>
        <div v-else>
          <p>No pending orders.</p>
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
import OrderContract from '../abi/OrderContract.json';
import StoredDelInfoContract from '../abi/StoredDelInfo.json';
import PaymentRecordContract from '../abi/PaymentRecord.json'; // Import ABI

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
      ProductionContractAddress: '0x2806B49E0b477a3A26A735B3AC8d78c349F4292F', // Update with your contract address
      productionIdToTxHash: {},
      StoredRecInfoContract: null,
      StoredRecInfoContractAddress: '0xef5114488A6e51Ae464EF2B415A034Af4b98e612', // Update with your contract address
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      orderContract: null,
      orderContractAddress: '0xD48f4716fa30a98A5528075A9bB6AFc34c8A8c4C', // Replace with your deployed contract address
      orders: [],
      StoredDelInfoContract: null,
      StoredDelInfoContractAddress: '0x26A3a9ae165b3e74b89614A0017E59d46bDc9B14', // Update with your contract address
      orderIdToTxHash: {},
      paymentRecordContract: null,
      paymentRecordAddress: '0xf622eE8c53ff8d0FDdA2B1d35A0CFEA9177F3628'
    };
  },
  methods: {
    formatTimestamp(unixTimestamp) {
      const timestamp = Number(unixTimestamp);
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },
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

        // Get the block timestamp
        const secondblock = await this.web3.eth.getBlock('latest');
        const secondtimestamp = secondblock.timestamp;

        // Record the payment in PaymentRecord contract
        const paymentType = 0; // 0 for Buy
        const userId = this.logedUser.id;

        // Convert product.price to Wei for storing
        const priceInWei = this.web3.utils.toWei(product.price.toString(), 'ether');

        const estimatedGas = await this.paymentRecordContract.methods
          .addPayment(
            secondtimestamp,
            paymentType,
            product.coffeeName,
            product.coffeeType,
            priceInWei,
            txHash
          )
          .estimateGas({ from: this.accounts[userId] });

        await this.paymentRecordContract.methods
          .addPayment(
            secondtimestamp,
            paymentType,
            product.coffeeName,
            product.coffeeType,
            priceInWei,
            txHash
          )
          .send({ from: this.accounts[userId], gas: estimatedGas });

        console.log('Payment recorded in PaymentRecord contract');

      } catch (error) {
        console.error('Error handling approve click:', error);
        alert('Error handling approve click');
      }
    },
    getStatusText(status) {
      let statusNum;

      if (typeof status === 'bigint') {
        statusNum = Number(status); // Convert BigInt to Number
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
    async fetchOrders() {
      try {
        const count = await this.orderContract.methods.getOrderCount().call();
        const orders = [];

        for (let i = 0; i < count; i++) {
          const orderData = await this.orderContract.methods.getOrder(i).call();
          const realstatus = orderData[6];
          const statusNum = Number(orderData[6]); // OrderStatus is at index 6

          if (statusNum === 0) { // Pending orders
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

            const order = {
              orderId: orderData[0],
              coffeeName: orderData[1],
              beanType: orderData[2],
              quantity: Number(orderData[3]), // Convert BigInt to Number
              price: orderData[4],
              buyer: orderData[5],
              status: realstatus,
              txInfos: txInfos,
            };
            orders.push(order);
          }
        }

        this.orders = orders;
      } catch (error) {
        console.error('Error fetching orders:', error);
        alert('Error fetching orders');
      }
    },

     // Added missing methods
     formatPrice(priceInWei) {
      const priceInEth = this.web3.utils.fromWei(priceInWei.toString(), 'ether');
      return parseFloat(priceInEth).toFixed(2);
    },
    async handleApproveOrder(orderId) {
      try {
        // Approve the order in the smart contract and get the transaction receipt
        await this.orderContract.methods
          .approveOrder(orderId)
          .send({ from: this.accounts[this.logedUser.id] });
        alert('Order approved');

        // Get the transaction hash from the orderIdToTxHash
        const txHash = this.orderIdToTxHash[orderId];
        if (txHash) {
          // Store the txHash in StoredDelInfoContract
          const userId = this.logedUser.id;
          const estimatedGas = await this.StoredDelInfoContract.methods
            .addString(txHash)
            .estimateGas({ from: this.accounts[userId] });
          await this.StoredDelInfoContract.methods
            .addString(txHash)
            .send({ from: this.accounts[userId], gas: estimatedGas });

          alert('Transaction hash stored in StoredDelInfo contract');
          
          // Fetch the stored data from StoredDelInfoContract and log it
          const storedData = await this.StoredDelInfoContract.methods
            .getAllStrings()
            .call({ from: this.accounts[userId] });

          console.log('Stored data in StoredDelInfo contract:', storedData);
        } else {
          console.warn(`No txHash found for orderId: ${orderId}`);
        }

        // Remove the approved order from the list
        this.orders = this.orders.filter(order => order.orderId !== orderId);
      } catch (error) {
        console.error('Error approving order:', error);
        alert('Error approving order');
      }
    },


    async handleRejectOrder(order) {
      const orderId = order.orderId;
      try {
        // Get the order data from the smart contract
        const orderData = await this.orderContract.methods.getOrder(orderId).call();

        // Extract buyer's address and price
        const buyerAddress = orderData[5]; // Assuming buyer address is at index 5
        const priceInWei = orderData[4];   // Assuming price is at index 4

        // Reject the order in the smart contract
        await this.orderContract.methods.rejectOrder(orderId).send({ from: this.accounts[this.logedUser.id] });

        // Send Ether back to the buyer as a refund
        await this.web3.eth.sendTransaction({
          from: this.accounts[this.logedUser.id],
          to: buyerAddress,
          value: priceInWei,
        });

        alert(`Order rejected and refund of ${this.web3.utils.fromWei(priceInWei, 'ether')} ETH sent to buyer.`);

        // Remove the rejected order from the list
        this.orders = this.orders.filter(o => o.orderId !== orderId);

        // Update the confirmedProductions in the Vuex store
        for (const txInfo of order.txInfos) {
          const updatedQuantity = Number(txInfo.quantity) * 0.1;

          this.$store.dispatch('addOrUpdateConfirmedProduction', {
            coffeeName: order.coffeeName,
            beanType: order.beanType,
            quantity: updatedQuantity,
            txInfo: {
              ...txInfo,
              quantity: updatedQuantity,
            },
          });
        }


        // Record the refund in PaymentRecord contract
        const block = await this.web3.eth.getBlock('latest');
        const timestamp = block.timestamp;
        const paymentType = 2; // 2 for Refund
        const userId = this.logedUser.id;

        const txHash = this.orderIdToTxHash[orderId]; // Get txHash associated with the order

        const estimatedGas = await this.paymentRecordContract.methods
          .addPayment(
            timestamp,
            paymentType,
            order.coffeeName,
            order.beanType,
            order.price,
            txHash
          )
          .estimateGas({ from: this.accounts[userId] });

        await this.paymentRecordContract.methods
          .addPayment(
            timestamp,
            paymentType,
            order.coffeeName,
            order.beanType,
            order.price,
            txHash
          )
          .send({ from: this.accounts[userId], gas: estimatedGas });

        console.log('Refund recorded in PaymentRecord contract');
      } catch (error) {
        console.error('Error rejecting order:', error);
        alert('Error rejecting order');
      }
    },
    async getOrderEvents() {
      try {
        const events = await this.orderContract.getPastEvents('OrderCreated', {
          fromBlock: 0,
          toBlock: 'latest',
        });

        for (const event of events) {
          const orderId = event.returnValues.orderId;
          const txHash = event.transactionHash;
          this.orderIdToTxHash[orderId] = txHash;
          console.log('getOrderEvent txHash:', txHash);
        }
      } catch (error) {
        console.error('Error fetching OrderCreated events:', error);
      }
    }
  },
  async mounted() {
    this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
    this.accounts = await this.web3.eth.getAccounts();
    this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
    this.StoredRecInfoContract = new this.web3.eth.Contract(StoredRecInfoContract.abi, this.StoredRecInfoContractAddress);
    await this.fetchProductions();
    this.orderContract = new this.web3.eth.Contract(OrderContract.abi, this.orderContractAddress);
    await this.fetchOrders(); // Fetch orders when component is mounted
    await this.getOrderEvents(); // 주문 이벤트 가져오기
    this.StoredDelInfoContract = new this.web3.eth.Contract(
      StoredDelInfoContract.abi,
      this.StoredDelInfoContractAddress
    );
    this.paymentRecordContract = new this.web3.eth.Contract(
      PaymentRecordContract.abi,
      this.paymentRecordAddress
    );
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
.content{
  background: #C69B7B;
}
.content > aside{
  background-image: url('../../public/img/coffee-beans.png');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  width: 15%;
  aspect-ratio: 1;
  position: absolute;
  left: 5%;
  bottom: 25%;
  rotate: 5deg;
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