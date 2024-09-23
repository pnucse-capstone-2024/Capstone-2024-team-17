<template>
    <div>
        <table>
            <thead v-if="this.coffeeItems.size!=0">
                <tr>
                    <th>Product</th>
                    <th>Origin</th>
                    <th>P-day</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Subtotal</th>
                    <th>Options</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(coffee,idx) in coffeeItems" :key="idx">
                    <td scope="row">{{coffee[1].coffeeName}}</td>
                    <td v-if="coffee[1].origin !== ''">{{coffee[1].origin}}</td>
                    <td v-if="coffee[1].origin === ''">-</td>
                    <td v-if="coffee[1].pDay !== ''">{{coffee[1].pDay}}</td>
                    <td v-if="coffee[1].pDay === ''">-</td>
                    <td v-if="coffee[1].bType !== ''">{{coffee[1].bType}}</td>
                    <td>{{coffee[1].eachPrice(coffee[1].bType)}}</td>
                    <td>{{coffee[1].amount}}</td>
                    <td>{{coffee[1].totalCal(coffee[1].bType)}}</td>
                    <td><button @click="remItem(coffee[1].pId)">x</button></td>
                </tr>
            </tbody>
        </table>
        <article>
            <article>
                <h2 style="margin-top: 40px; margin-left: -6%;">Order Details</h2>
            </article>
            <section>
                <ul v-for="(coffee,idx) in coffeeItems" :key="idx">
                    <li>
                        <p><span style="margin-left: 10px;">{{coffee[1].coffeeName}}</span> x {{coffee[1].amount}}(100g)</p>
                    </li>
                </ul>
                <section>
                    <h3 style="margin-top: 40px;">Total: {{this.subTotal.toFixed(2)}}<small>({{this.totalPrice.toFixed(2)}}(price) - {{this.discountPrice.toFixed(2)}}(discount) + {{this.commision.toFixed(2)}}(commision))</small></h3>
                    <p style="margin-top: 60px;">Available ETH: {{ userBalance }}</p>
                </section>
                <h2></h2>
            </section>
            <section>
                <h2 style="margin-top: 60px; margin-left: 0%;">-Shipping Info</h2>
                <form>
                    <label>Address: <input v-model="shipAddr" type="text" placeholder="Write address" required></label>
                    <label>Phone: <input v-model="shipTel" type="tel" placeholder="Write phone number" required></label>
                    <br/>
                    <br/>
                    <p><input v-model="chBox" type="checkbox" required> Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our "Privacy policy" and "terms and conditions".</p>
                    <button @click="orderFunc" type="submit">Place order</button>
                </form>
            </section>
        </article>
        <div>
        </div>
    </div>
</template>
<script>

import Web3 from 'web3';
import CoffeeContract from '../abi/PaymentContract.json';
import { mapActions } from 'vuex';

export default {
    name:'CartTableCompo',
    props:['cartList'],
    data(){
        return{
            coffeeItems:this.cartList,
            subTotal:0,
            totalPrice:0,
            commision:0,
            discountPrice:0,
            mPoint:0,
            logedUser:'',
            loggedUser: JSON.parse(sessionStorage.getItem('logeduser')),
            userBalance: 0,
            pointFlag:true,
            totalPoint:0,
            tmpPoint:0,
            shipAddr:'',
            shipTel:'',
            chBox:false,
            show: false,
            web3: null,
            contract: null,
            accounts: [],
            contractAddress: '0xa6A96Be3f5CbBCa1Edf1533c8A3e3b61A2b1a2eD' // released contract address through Remix IDE
        }
    },
    methods:{
        ...mapActions(['updateConfirmedProductionQuantity']),
        
        async loadUserBalance() {
            try {
                this.accounts = await this.web3.eth.getAccounts();
                //console.log('Accounts:', this.accounts); // 계정 정보 출력

                if (this.accounts.length === 0) {
                    throw new Error('No accounts found');
                }

                const userId = this.logedUser.id;
                //console.log('User ID:', userId); // User ID 출력
                //console.log('Selected Account:', this.accounts[userId]); // 선택된 계정 출력

                if (!this.accounts[userId]) {
                    throw new Error('Invalid user ID or no associated account');
                }

                const balance = await this.web3.eth.getBalance(this.accounts[userId]);
                this.userBalance = parseFloat(this.web3.utils.fromWei(balance, 'ether')).toFixed(2); // 잔액을 ETH로 변환하여 소수점 4자리까지만 표시
            } catch (error) {
                console.error('Error fetching ETH balance:', error.message);
            }
        },
        remItem(pid){
            // console.log(pid);
            this.totalPrice = 0;
            this.discountPrice = 0;
            this.$emit("remItem",pid);
        },
        goHome(){
            this.$router.push({
                name:'products-page'
            })
        },


        async orderFunc() {
            try {
                // 각 커피 항목에 대해 트랜잭션 수행
                for (let [coffeeId, coffee] of this.coffeeItems.entries()) {
                    const quantity = coffee.amount;
                    const coffeeIndex = parseInt(coffeeId);
                    const totalUnitPrice = coffee.totalCal(coffee.bType); // 총 가격 계산 (ETH로)
                    const totalUnitPriceWei = this.web3.utils.toWei(totalUnitPrice.toString(), 'ether');

                    // 트랜잭션 발생
                    await this.contract.methods.purchaseCoffee(coffeeIndex, quantity).send({
                        from: this.accounts[this.logedUser.id],
                        to: this.accounts[coffeeIndex + 10],  // 각 coffeeId에 맞는 주소로 송금
                        value: totalUnitPriceWei,
                    });

                    // 주문한 수량만큼 재고 감소
                    // 커피 이름과 타입을 가져옵니다.
                    const coffeeName = coffee.coffeeName;
                    const beanType = coffee.bType;
                    const orderedAmount = quantity; 


                    console.log('coffeeName:', coffeeName);
                    console.log('beanType:', beanType);
                    console.log('orderedAmount:', orderedAmount);

                        
                    // Vuex 스토어에서 해당 상품을 찾습니다.
                    const product = this.$store.getters.getConfirmedProductions.find(
                        item => item.coffeeName === coffeeName && item.beanType === beanType,
                    );

                    if (product) {
                        const newQuantity = ((product.quantity * 10) - orderedAmount) / 10;

                        console.log('Original quantity:', product.quantity);
                        console.log('New quantity:', newQuantity);

                        if (newQuantity < 0) {
                            alert(`The stock of ${coffeeName} (${beanType}) is insufficient`);
                            return;
                        }

                        this.$store.dispatch('updateConfirmedProductionQuantity', {coffeeName, beanType, newQuantity});

                    } 
                    else {
                        alert(`${coffeeName} (${beanType}) cannot be found`);
                        return;
                    }
                }

                if (!this.loggedUser.manager) {
                     // 주문 완료 후 커미션 차감
                    const commissionWei = this.web3.utils.toWei(this.commision.toString(), 'ether');
                    await this.web3.eth.sendTransaction({
                        from: this.accounts[this.logedUser.id],
                        to: this.accounts[23],  
                        value: commissionWei,
                    });
                    //console.log(`Commission of ${this.commision} ETH sent to contract.`);
                }
                this.shipAddr = '';
                this.shipTel = '';
                this.chBox = false;
                this.logedUser.point -= this.mPoint;
                this.logedUser.point += this.addPoint;
                this.mPoint = 0;
                sessionStorage.setItem('logeduser', JSON.stringify(this.logedUser));
                localStorage.clear();
                location.reload();
                this.show = true;

            }
            catch (error) {
                console.error('Transaction failed:', error);
                alert(`There was an error processing your transaction: ${error.message}`);
            }
    }

    },
    watch:{
        coffeeItems:{
            handler(){
                this.coffeeItems.forEach((value)=>{
                    this.totalPrice += parseFloat(value.totalCal(value.bType));
                    this.discountPrice += parseFloat(value.discount(value.amount, value.bType));
                })
                if (this.loggedUser.manager) {
                    this.commision = 0;
                }
                else {
                    this.commision = (this.totalPrice - this.discountPrice)*0.30;
                }
                this.subTotal = this.totalPrice - this.discountPrice + this.commision;
            },
            deep:true,
            immediate:true,
        },
    },
    async mounted() {
        this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
        this.contract = new this.web3.eth.Contract(CoffeeContract.abi, this.contractAddress);

        this.logedUser = JSON.parse(sessionStorage.getItem('logeduser'));

        // logedUser와 logedUser.id 확인
        if (!this.logedUser || typeof this.logedUser.id === 'undefined') {
            console.error('logedUser or logedUser.id is undefined', this.logedUser);
        } else {
            //console.log('logedUser:', this.logedUser);
            //console.log('logedUser.id:', this.logedUser.id);
            await this.loadUserBalance();  // 로그인한 사용자의 잔액을 로드
        }
    }

}
</script>
<style scoped>
/* Shopping Cart */
div{
    margin-left: 15%;
} 
table{
    width: 90%;
    border-collapse: collapse;
}
tr{
    border-bottom: 1px solid black;
}
tr > *{
    text-align: center;
}
th{
    background: rgba(174, 33, 33, 0.182);
    border: 1px solid black;
}
thead > tr{
    height: 10vh;
}
thead > tr > *{
    width: 12.5%;
}
tbody > tr{
    height: 20vh;
}
table button{
    background-color: rgba(252, 30, 30, 0.264);
    color: red;
    border: 1px solid red;
    border-radius: 5px;
    width: 70%;
    aspect-ratio: 1;
    margin: 10px;
}
table button:hover{
    cursor: pointer;
    background-color: rgba(252, 30, 30, 0.405);
}
/* Order Details */
article > article{
    font-size: 1.4em;
    margin-left: 5%;
}
ul{
    margin-top: 3%;
    margin-bottom: 3%;
    padding-left: 40px;
}
input{
    background: transparent;
    border: 0px none transparent;
    border-bottom: 2px solid rgba(252, 30, 30, 0.264);
    padding: 2%;
}
button{
    margin-top: 2%;
    margin-bottom: 2%;
    background: transparent;
    border: 2px solid rgba(252, 30, 30, 0.264);
    border-radius: 5px 5px 0px 0px;
    padding: 2%;
}
button:hover{
   cursor: pointer;
   background: hsl(26deg 100% 82%) ;
}
section > h2{
    margin-left: 5%;
    margin-top: 5%;
    margin-bottom: 5%;
}
form > p:nth-child(9){
    width: 70%;
    margin-top: 5%;
}
</style>