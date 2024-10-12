<template>
  <div class="modal-backdrop">
      <div class="modal">
          <header class="modal-header">
              <slot name="header">Please enter the today's production volume.</slot>
              <button type="button" class="btn-close" @click="close">x</button>
          </header>

          <section class="modal-body">
              <aside class="coffeeImg">{{ coffeeName }}</aside>
              <div class="bodytest" name="body">
                  <h2>{{ coffeeName }}</h2>
                  <div class="modal_main">
                    <div class="right">
                      <div>
                        <select v-model="coffeeBeanType" class="table-primary form-control">
                          <option value="" selected disabled>Select Coffee Type</option>
                          <option v-for="(option, idx) in options" :key="idx" :value="option.type">{{ option.type }}</option>
                        </select>
                      </div>
                      <div>
                        <span> Production Quantity (kg):</span>
                        <input type="number" min="0" v-model="productionQty" class="form-control">
                      </div>
                    </div>
                  </div>

                  <div v-if="transactionInfo" class="transaction-info">
                <h3>Transaction Details</h3>
                <p><strong>Transaction Hash:</strong> <span class="break-word">{{ transactionInfo.txHash }}</span></p>
                <p><strong>Block Number:</strong> {{ transactionInfo.blockNumber }}</p>
                <p><strong>Production Time:</strong> {{ transactionInfo.blockTime }}</p>
                <p><strong>Total Price:</strong> {{ transactionInfo.totalPrice }} ETH</p> 
              </div>
              </div>
          </section>

          <footer class="modal-footer">
              <button v-if="!productionSaved" type="button" class="btn-green" @click="saveProduction">Save Production</button>
              <button v-else type="button" class="btn-green" @click="close">Close</button>
          </footer>
      </div>
  </div>
</template>

<script>
import readJson from '../services/JsonService.js';
import Web3 from 'web3';
import CoffeeProductionContract from '../abi/CoffeeProduction.json';
import StoredProInfoContract from '../abi/StoredProInfo.json';
import coffeeData from '../../public/data/coffee.json'; // Import coffee.json
import optionData from '../../public/data/option.json'; // Import option.json

export default {
  name: 'ManageProduct',

  data() {
    return {
      coffeeList: new Map(),
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      coffeeBeanType: '',
      productionQty: 0,
      options: '',
      coffeeName: '',
      contract: null,
      accounts: [],
      coffeeId: 0,
      web3: null,
      transactionInfo: null,
      ProductionContractAddress: '0x2806B49E0b477a3A26A735B3AC8d78c349F4292F', // Update with new address
      StoredProInfoContract: null,
      StoredProInfoContractAddress: '0x25A691E1e85a40420e95BCC3415e562Ec68d4497',
      coffeePriceList: [], // To store coffee data
      optionsPrices: [], // To store type fees
      productionSaved: false,
    };
  },
  methods: {
    close() {
      this.productionSaved = false;
      this.$router.push({ name: 'products-page' });
    },
    loadCoffeeData() {
      this.coffeePriceList = coffeeData; // Load coffee.json data
      this.optionsPrices = optionData; // Load option.json data
    },
    // Calculate option fee
    calculateOptionFee(feeType) {
      const option = this.optionsPrices.find(opt => opt.type === feeType);
      return option ? Number(option.fee) : 0;
    },
    // Calculate each price
    calculateEachPrice(price, feeType) {
      const optionFee = this.calculateOptionFee(feeType);
      return price + optionFee;
    },
    // Calculate total price
    calculateTotalPrice(price, feeType, quantity) {
      const eachPrice = this.calculateEachPrice(price, feeType);
      return eachPrice * quantity * 5;
    },
    async saveProduction() {
      const userId = this.logedUser.id;
      if (this.coffeeBeanType && this.productionQty > 0 && this.coffeeName) {
        // Find the coffee item in coffeePriceList
        const coffeeItem = this.coffeePriceList.find(item => item.coffeeName === this.coffeeName);
        if (!coffeeItem) {
          console.error(`Coffee item not found for ${this.coffeeName}`);
          alert('Coffee item not found.');
          return;
        }

        const productionData = {
          beanType: this.coffeeBeanType,
          quantity: this.productionQty,
          coffeeName: this.coffeeName,
          origin: coffeeItem.origin, // Include origin
          status: this.status
        };

        const basePrice = Number(coffeeItem.price); // Base price
        const totalPrice = this.calculateTotalPrice(basePrice, productionData.beanType, productionData.quantity);
        productionData.totalPrice = totalPrice;

        try {
          const estimatedGas = await this.contract.methods
            .recordProduction(
              productionData.coffeeName,
              productionData.beanType,
              productionData.origin,
              productionData.quantity,
              productionData.totalPrice
            )
            .estimateGas({ from: this.accounts[userId] });

          const tx = await this.contract.methods
            .recordProduction(
              productionData.coffeeName,
              productionData.beanType,
              productionData.origin,
              productionData.quantity,
              productionData.totalPrice
            )
            .send({
              from: this.accounts[userId],
              gas: estimatedGas,
            });

          this.transactionInfo = {
            txHash: tx.transactionHash,
            blockNumber: tx.blockNumber,
            blockTime: new Date().toLocaleString(),
            totalPrice: productionData.totalPrice,
          };

          alert(`Production recorded successfully!`);

          // Store transaction hash in StoredProInfoContract
          const estimatedGasForAddString = await this.StoredProInfoContract.methods
            .addString(tx.transactionHash)
            .estimateGas({ from: this.accounts[userId] });

          await this.StoredProInfoContract.methods
            .addString(tx.transactionHash)
            .send({
              from: this.accounts[userId],
              gas: estimatedGasForAddString,
            });

          // Emit event to parent
          this.$emit('production-saved', productionData);

          // Store in Vuex
          this.$store.commit('addProduction', productionData);

          // Set productionSaved flag to true
          this.productionSaved = true;

        } catch (error) {
          console.error('Transaction failed:', error);
          alert('Error recording production');
        }
      } else {
        alert('Please select a coffee type, coffee name, or enter a valid production quantity.');
      }
    },
    loadJson() {
      readJson.getJson('option')
        .then(res => {
          this.options = res.data;
        })
        .catch(err => { console.log(err); });

      readJson.getJson('coffee')
        .then((res) => {
          for (let idx in res.data) {
            this.coffeeList.set(res.data[idx].pId, res.data[idx]);
          }
          const managedCoffeeId = this.logedUser.id - 10;
          const managedCoffee = this.coffeeList.get(managedCoffeeId);
          if (managedCoffee) {
            this.coffeeName = managedCoffee.coffeeName;
          } else {
            console.log('Managed coffee not found');
          }
        })
        .catch((er) => {
          console.log(er);
        });
    },
  },
  async mounted() {
    this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
    this.accounts = await this.web3.eth.getAccounts();
    this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.ProductionContractAddress);
    this.StoredProInfoContract = new this.web3.eth.Contract(StoredProInfoContract.abi, this.StoredProInfoContractAddress);
    this.loadCoffeeData();
    this.loadJson();
  },
};
</script>


<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  translate: 21vw;
  height: 80%;
  aspect-ratio: 1;
  background: #FFFFFF;
  box-shadow: 2px 2px 20px 1px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
}
.modal-header,
.modal-footer {
  padding: 10px;
  display: flex;
}
.modal-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  padding: 2%;
  justify-content: space-between;
}
.modal-footer {
  border-top: 1px solid #eeeeee;
  flex-direction: column;
}
.modal-body {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 5px 10px;
}
.btn-close {
  position: absolute;
  top: 0;
  right: 3%;
  border: none;
  font-size: 20px;
  padding: 5px;
  cursor: pointer;
  font-weight: bold;
  color: grey;
  background: transparent;
}
.btn-green {
  color: white;
  background: #4AAE9B;
  border: 1px solid #4AAE9B;
  border-radius: 5px;
  padding: 1%;
}
.modal_main{
  display: flex;
}
.coffeeImg{
  width: 100%;
  height: 200px;
  border-radius: 10px;
  font-size: 40px;
  font-weight: 700;
  padding-bottom: 2%;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background-image: url(../../public/img/pexels-jessica-lewis-creative-867466.jpg);
  background-position: center;
  background-size: cover;
}
.right{
  display: flex;
  flex-direction: column;
}
.right div {
  display: flex;
  flex-direction: column;
}
select{
  padding: 1%;
  border-radius: 5px;
  border: 1px solid #4AAE9B;
}
input{
  padding: 3%;
  border: 1px solid #4AAE9B;
  background: transparent;
}
.break-word {
  word-break: break-all; /* 또는 word-wrap: break-word; */
}
</style>
