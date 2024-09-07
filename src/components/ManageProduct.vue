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

  data() {
    return {
      coffeeList: new Map(),
      logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
      coffeeBeanType: '',
      productionQty: 0,
      options: '',
      coffeeName: ''
    };
  },
  methods: {
    close() {
      this.$router.push({ name: 'products-page' });
    },
    
    saveProduction() {
      if (this.coffeeBeanType && this.productionQty > 0) {
        this.$emit('saveProduction', { beanType: this.coffeeBeanType, quantity: this.productionQty });
        this.close();
      } 
      else {
        alert("Please select a coffee type or enter a valid production quantity.");
      }
    },

    loadJson(){
      readJson.getJson("option")
        .then(res=>{
          this.options = res.data;
        })
        .catch(err=>{console.log(err)})

      readJson.getJson('coffee')
        .then((res) => {
          for (let idx in res.data) {
            this.coffeeList.set(res.data[idx].pId, res.data[idx]);
          }
          // 판매자가 관리하는 커피를 찾음
          const managedCoffeeId = this.logedUser.id - 10; // ID에서 10을 뺀 값을 pId로 사용
          const managedCoffee = this.coffeeList.get(managedCoffeeId);
          if (managedCoffee) {
            this.coffeeName = managedCoffee.coffeeName; // 판매하는 커피의 이름을 설정
          } 
          else {
            console.log('Managed coffee not found');
          }
        })
        .catch((er) => {
          console.log(er);
        });
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
