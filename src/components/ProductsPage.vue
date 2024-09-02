<template>
    <div>
      <section class="left-side"></section>
      <section class="content">
        <aside></aside>
        <section class="right-side">
          <div class="productPage">
            <div class="PageDetails">
              <article v-if="memberstat !== null">
                <h2>Welcome {{ fullName }}</h2>
                <h3 v-show="memberstat">Membership: Full Member | ETH(Ξ): {{ userBalance }}</h3>
                <h3 v-show="!memberstat">Membership: None</h3>
              </article>
              <article v-if="isSeller">
                <button class="manageProduct" @click="manageProduct()">Manage your product</button>
              </article>
              <h2>Products Page</h2>
              <div class="coffeePage">
                <div class="coffeeBox" v-for="(product, idx) in coffeeList" :key="idx">
                  <aside class="productImg">{{ product[1].coffeeName }}</aside>
                  <div class="text">
                    <h3>Ξ {{ product[1].price }} / <small>100g</small></h3>
                    <button type="button" class="btn toModal" @click="showModal(product[1])">Select!</button>
                  </div>
                </div>
              </div>
              <div>
                <ProModal
                  v-show="isModalVisible"
                  @close="closeModal"
                  @cartAdding="cartAdding"
                  :CoffeeOptions="getProduct"
                ></ProModal>
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
</template>
  
  <script>
  import Web3 from 'web3';
  import readJson from '../services/JsonService.js';
  import ProModal from './ProModal.vue';
  import { productClass } from '@/classes/productClass';
  
  export default {
    name: 'ProductsPage',
    components: {
      ProModal,
    },
    data() {
      return {
        selectedCoffee: '',
        coffeeList: new Map(),
        getProduct: '',
        isModalVisible: false,
        logedUser: JSON.parse(sessionStorage.getItem('logeduser')),
        fullName: '',
        memberstat: null,
        userBalance: 0,
        web3: null,
        accounts: [],
        isSeller: false,
      };
    },
    methods: {
      async loadUserBalance() {
        try {
          this.accounts = await this.web3.eth.getAccounts();
          const userId = this.logedUser.id;  // 로그인한 사용자의 ID를 가져옴
          const balance = await this.web3.eth.getBalance(this.accounts[userId]);  // 해당 인덱스의 이더리움 잔액 조회
          this.userBalance = parseFloat(this.web3.utils.fromWei(balance, 'ether')).toFixed(2); // 잔액을 ETH로 변환하여 저장
        } catch (error) {
          console.error('Error fetching ETH balance:', error);
        }
      },
      loadJson() {
        readJson.getJson('coffee')
          .then((res) => {
            for (let idx in res.data) {
              this.coffeeList.set(res.data[idx].pId, res.data[idx]);
            }
          })
          .catch((er) => {
            console.log(er);
          });
      },
      showModal(val) {
        this.isModalVisible = true;
        let coffeeOject = new productClass(val.pId, val.coffeeName, val.price, val.description, '', '', '', 1);
        this.getProduct = coffeeOject;
      },
      closeModal() {
        this.isModalVisible = false;
      },
      cartAdding(val) {
        this.$emit('shoppingCart', val);
      },
      goCart() {
        this.$router.push({
          name: 'cart-page',
        });
      },
      manageProduct() {
        this.$router.push({ name: 'member-ship' });
      },
    },
    async mounted() {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));  // Ganache에 연결
      await this.loadUserBalance();  // 로그인한 사용자의 잔액을 로드
  
      this.loadJson();
      if (sessionStorage.getItem('logeduser')) {
        this.fullName = this.logedUser.first_name + ' ' + this.logedUser.last_name;
        this.memberstat = this.logedUser.membership;
        this.isSeller = this.logedUser.seller;

        // console.log('isSeller:', this.isSeller);
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
.coffeeBox{
    border: 0.2px solid rgb(239, 239, 239);
    box-shadow: 1px 1px 3px;
    border-radius: 10px;
    padding: 2%;
    width: 30%;
    background-color: rgb(255, 248, 248);
    display: flex;
    flex-direction: column;
    justify-content: center;
    row-gap: 2vh;
    color: rgb(70, 67, 67);
}
.coffeeBox:hover{
    scale: 1.02;
    color: rgb(98, 51, 18);
    cursor: default;
}
aside{
    text-shadow: 2px 2px 5px black;
}
.coffeeImg{
    border-radius: 5px;
}
.productImg{
    height: 170px;
    width: 100%;
    border-radius: 10px;
    font-size: 20px;
    font-weight: 700;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-image: url(../../public/img/pexels-jessica-lewis-creative-867466.jpg);
    background-position: center;
    background-size: cover;
}


.coffeeBox:nth-child(1) .productImg {
    background-image: url(../../public/img/1.jpg);
}

.coffeeBox:nth-child(2) .productImg {
    background-image: url(../../public/img/2.jpg);
}

.coffeeBox:nth-child(3) .productImg {
    background-image: url(../../public/img/3.jpg);
}

.coffeeBox:nth-child(4) .productImg {
    background-image: url(../../public/img/4.jpg);
}

.coffeeBox:nth-child(5) .productImg {
    background-image: url(../../public/img/5.jpg);
}

.coffeeBox:nth-child(6) .productImg {
    background-image: url(../../public/img/6.jpg);
}

.coffeeBox:nth-child(7) .productImg {
    background-image: url(../../public/img/7.jpg);
}

.coffeeBox:nth-child(8) .productImg {
    background-image: url(../../public/img/8.jpg);
}

.coffeeBox:nth-child(9) .productImg {
    background-image: url(../../public/img/9.jpg);
}

.coffeeBox:nth-child(10) .productImg {
    background-image: url(../../public/img/10.jpg);
}

.coffeeBox:nth-child(11) .productImg {
    background-image: url(../../public/img/11.jpg);
}

.coffeeBox:nth-child(12) .productImg {
    background-image: url(../../public/img/12.jpg);
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