<template>
  <div class="modal-backdrop">
      <div class="modal">
          <header class="modal-header">
              <slot name="header">Please enter the production volume.</slot>
              <button type="button" class="btn-close" @click="close">x</button>
          </header>

          <section class="modal-body">
              <div class="bodytest" name="body">
                  <h2>{{ coffeeName }}</h2>
                  <div class="modal_main">
                    <div class="right">
                      <div>
                        <select v-model="selectedCoffee" @change="updatePrice" class="table-primary form-control">
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
              </div>
          </section>

          <footer class="modal-footer">
              <button type="button" class="btn-green" @click="saveProduction">Save Production</button>
          </footer>
      </div>
  </div>
</template>

<script>
import readJson from '../services/JsonService.js'
export default {
  name: 'ManageProduct',
  props: ['coffeeList'],
  data() {
    return {
      selectedCoffee: '',
      productionQty: 0,
      options: '',
      coffeeName: ''
    };
  },
  methods: {
    close() {
      this.$router.push({ name: 'products-page' });
    },
    updatePrice() {
      const selected = this.coffeeList.find(coffee => coffee.pId === this.selectedCoffee);
      this.coffeeName = selected ? selected.coffeeName : '';
    },
    saveProduction() {
      if (this.selectedCoffee && this.productionQty > 0) {
        this.$emit('saveProduction', { pId: this.selectedCoffee, quantity: this.productionQty });
        this.close();
      } else {
        alert("Please select a coffee and enter a valid production quantity.");
      }
    },
    loadJson(){
          readJson.getJson("option")
          .then(res=>{
              this.options = res.data
          }).catch(err=>{console.log(err)})
      },
  },
  mounted(){
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
