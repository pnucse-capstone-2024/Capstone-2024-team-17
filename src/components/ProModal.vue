<template>
  <div class="modal-backdrop">
      <div class="modal">
          <header class="modal-header">
              <slot name="header">
                {{CoffeeOptions.description}}
              </slot>
              <button type="button" class="btn-close" @click="close">x</button>
          </header>

          <section class="modal-body">
              <aside class="coffeeImg">{{CoffeeOptions.coffeeName}}</aside>
              <div class="bodytest" name="body">
                  <h2>
                    {{CoffeeOptions.coffeeName}}
                  </h2>
                  <h3>
                    Price : Ξ {{newPrice}} / <small>100g</small>
                  </h3>
                  <div class="modal_main">
                    <div class="right">
                      <div>
                        <select v-model="selectedOption" v-on:change="totalCh()" class="table-primary form-control">
                          <option value="no" selected disabled>Select your Coffee Bean Type</option>
                          <option v-for="(option,idx) in options" :key="idx" v-bind:value="option.fee">{{option.type}}</option>
                        </select>
                      </div>
                      <div>
                        <span v-show="!flag"> weight(100g) :</span>
                        <input  min='0' v-show="!flag" type="number" v-model="amount" v-on:change="totalCh()">
                      </div>
                    </div>
                  </div>
              </div>
          </section>

          <footer class="modal-footer">
              <button type="button" class="btn-green" @click="addTocart">Add Cart</button>
          </footer>
      </div>
  </div>
</template>
<script>
import { productClass } from '@/classes/productClass';
import readJson from '../services/JsonService.js'
export default {
  name: 'ProModal',
  props:['CoffeeOptions'],
  data(){
      return{
          selectedOption: "no",
          options: '',
          optionFee:0,
          amount:1,
          flag:false,
          total:0,
          newPrice : this.CoffeeOptions.price
      }
  },
  methods: {
      close() {
        this.total = 0
        this.amount=1;
        this.selectedOption = "no"
        this.$emit('close');
      },
      addTocart(){
        if(this.selectedOption =="no"){
          alert("You have to choose all the options")
        }else{
          let addCart = new productClass(this.CoffeeOptions.pId,this.CoffeeOptions.coffeeName,this.CoffeeOptions.price,"","",this.selectedOption,"","",this.amount)
          this.total = 0
          this.amount=1;
          this.selectedOption = "no"
          this.flag = false
          this.$emit('close');
          this.$emit('cartAdding',addCart);
        }
      },
      loadJson(){
          readJson.getJson("option")
          .then(res=>{
              this.options = res.data
          }).catch(err=>{console.log(err)})
      },
      totalCh(){
        let price = this.totalAll();
        this.flag = false
        this.optionFee = this.selectedOption;
        let price2 = ((price + this.optionFee) * this.amount).toFixed(2);
        this.newPrice = price + this.optionFee
        this.total = price2;
      },
      totalAll(){
          let cal = 0;
          cal = this.CoffeeOptions.price
          return cal
      },
  },
  watch:{
    newPrice(){
      if(this.newPrice == undefined){
        console.log('yes')
      }
    }
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
  height: 150px;
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
.left{
  width: 65%;
  text-align: center;
  background-color: #4AAE9B;
  color: white;
  margin-right: 5px;
  border-radius: 10px;
}
.right{
  display: flex;
  flex-direction: column;
}
.right div {
  display: flex;
  flex-direction: column;
}
h2, h3, h5{
  margin: 10px 0px;
} 
select{
  padding: 1%;
  border-radius: 5px;
  border: 1px solid #4AAE9B;
  right: 5%;
  bottom: 1%;
}
input{
  padding: 3%;
  border: 1px solid #4AAE9B;
  background: transparent;
}
</style>