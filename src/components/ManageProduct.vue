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
                <p><strong>Transaction Hash:</strong> {{ transactionInfo.txHash }}</p>
                <p><strong>Block Number:</strong> {{ transactionInfo.blockNumber }}</p>
                <p><strong>Production Time:</strong> {{ transactionInfo.blockTime }}</p>
              </div>
              </div>
          </section>

          <footer class="modal-footer">
              <button type="button" class="btn-green" @click="saveProduction">Save Production</button>
          </footer>
      </div>
  </div>
</template>

<script>
import readJson from '../services/JsonService.js';
import Web3 from 'web3';
import CoffeeProductionContract from '../abi/CoffeeProduction.json';
import AccountContract from '../abi/AccountContract.json';

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
      contractAddress: '0xe2Fa463Ffb77eC310f69461361351B59E2A79479',
      accountContract: null,
      accountContractAddress: '0x79Cd64F2D9EF361Af8c96e49C1Be367340dB5ab0',
    };
  },
  methods: {
    close() {
      this.$router.push({ name: 'products-page' });
    },

    async saveProduction() {
      const userId = this.logedUser.id;
      if (this.coffeeBeanType && this.productionQty > 0 && this.coffeeName) {
        const productionData = {
          beanType: this.coffeeBeanType,
          quantity: this.productionQty,
          coffeeName: this.coffeeName,
          status: this.status
        };

        try {
          const estimatedGas = await this.contract.methods
            .recordProduction(productionData.coffeeName, productionData.beanType, productionData.quantity)
            .estimateGas({ from: this.accounts[userId] });

          const tx = await this.contract.methods
            .recordProduction(productionData.coffeeName, productionData.beanType, productionData.quantity)
            .send({
              from: this.accounts[userId],
              gas: estimatedGas,
            });

          this.transactionInfo = {
            txHash: tx.transactionHash,
            blockNumber: tx.blockNumber,
            gasUsed: tx.gasUsed,
            blockTime: new Date().toLocaleString(),
          };

          // Save TxHash to AccountContract
          const estimatedGasForAddString = await this.accountContract.methods
            .addString(tx.transactionHash)
            .estimateGas({ from: this.accounts[userId] });

          await this.accountContract.methods
            .addString(tx.transactionHash)
            .send({
              from: this.accounts[userId],
              gas: estimatedGasForAddString,
            });

          alert(`Production recorded successfully!`);

          // 기존 생산 데이터에서 해당 항목 제거 (체크된 항목 삭제)
          this.$emit('production-saved', productionData);

          // Vuex에 저장
          this.$store.commit('addProduction', productionData);

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
    this.contract = new this.web3.eth.Contract(CoffeeProductionContract.abi, this.contractAddress);
    this.accountContract = new this.web3.eth.Contract(AccountContract.abi, this.accountContractAddress);
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
</style>
