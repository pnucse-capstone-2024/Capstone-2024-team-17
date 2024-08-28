<template>
    <div>
        <table>
            <thead v-if="this.coffeeItems.size!=0">
                <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>-</th>
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
                    <td v-if="coffee[1].bSize !== ''">{{coffee[1].bSize}}</td>
                    <td v-if="coffee[1].bSize === ''">-</td>
                    <td v-if="coffee[1].bTemp !== ''">{{coffee[1].bTemp}}</td>
                    <td v-if="coffee[1].bTemp === ''">-</td>
                    <td v-if="coffee[1].bType!== ''">{{coffee[1].bType}}</td>
                    <td v-if="coffee[1].bType === ''">-</td>
                    <td>{{coffee[1].eachPrice()}}</td>
                    <td>{{coffee[1].amount}}</td>
                    <td>{{coffee[1].totalCal()}}</td>
                    <td><button @click="remItem(coffee[1].pId)">x</button></td>
                </tr>
            </tbody>
        </table>
        <article>
            <article>
                <h2 style="margin-top: 40px; margin-left: -5%;">Order Details</h2>
            </article>
            <section>
                <ul v-for="(coffee,idx) in coffeeItems" :key="idx">
                    <li v-if="coffee[1].type !== 'Beverage'">
                        <p><span style="margin-left: 10px;">{{coffee[1].coffeeName}}</span> x {{coffee[1].amount}}(100g)</p>
                    </li>
                </ul>
                <section>
                    <h3>SubTotal: {{this.subTotal.toFixed(2)}}<small>({{this.totalPrice.toFixed(2)}}(price) - {{this.discountPrice.toFixed(2)}}(discount) + {{this.tax.toFixed(2)}}(tax))</small></h3>
                    <p style="margin-top: 20px;">Available ETH: {{ userBalance }}</p>
                </section>
                <h2>-Total:{{this.tmpPrice.toFixed(2)}}<small>({{this.subTotal.toFixed(2)}}-{{this.mPoint}} Eths)</small></h2>
                <small>Reward ETH: {{this.addPoint}}</small>
            </section>
            <section>
                <h2>-Shipping Info</h2>
                <form @submit.prevent="orderFunc">
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
import CoffeeContract from '../abi/CoffeeContract.json'; // ABI 기록 파일. 스마트컨트랙트 코드 바뀔때마다 갱신 필요.

export default {
    name:'CartTableCompo',
    props:['cartList'],
    data(){
        return{
            coffeeItems:this.cartList,
            subTotal:0,
            totalPrice:0,
            tmpPrice:0,
            tax:0,
            discountPrice:0,
            mPoint:0,
            logedUser:'',
            pointFlag:true,
            totalPoint:0,
            tmpPoint:0,
            addPoint:0,
            shipAddr:'',
            shipTel:'',
            chBox:false,
            show: false,
            web3: null,
            contract: null,
            accounts: [],
            contractAddress: '0x1B0892375850f8030a01aBc14767ED139543244b' // 스마트컨트랙트 배포할때마다 거래 주소를 바꿔줘야함.
        }
    },
    methods:{
        async loadUserBalance() {
            try {
                this.accounts = await this.web3.eth.getAccounts();
                console.log('Accounts:', this.accounts); // 계정 정보 출력

                if (this.accounts.length === 0) {
                    throw new Error('No accounts found');
                }

                const userId = this.logedUser.id;
                console.log('User ID:', userId); // User ID 출력
                console.log('Selected Account:', this.accounts[userId]); // 선택된 계정 출력

                if (!this.accounts[userId]) {
                    throw new Error('Invalid user ID or no associated account');
                }

                const balance = await this.web3.eth.getBalance(this.accounts[userId]);
                this.userBalance = this.web3.utils.fromWei(balance, 'ether'); // 잔액을 ETH로 변환하여 저장
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
        usePoint(){
            this.totalPoint = this.userBalance;
            this.tmpPrice = this.subTotal;
            if(this.mPoint < this.totalPoint && 0 < (this.tmpPrice - this.mPoint) ){
                this.tmpPrice -= this.mPoint;
            }else{
                alert("Check your available points");
            }
        },
        async orderFunc(){
            if (!this.chBox) {  // 체크박스가 체크되지 않았을 경우
                alert("Please agree to the Privacy Policy and Terms and Conditions.");  // 경고 메시지를 표시합니다.
                event.preventDefault(); // 폼 제출을 막음
                return;  // 함수 종료
            }

            try {
                for (let [coffeeId, coffee] of this.coffeeItems.entries()) {
                    const quantity = coffee.amount;
                    const coffeeIndex = parseInt(coffeeId); // coffeeId를 정수로 변환
                    const totalPrice = coffee.totalCal(); // 총 가격 계산 (ETH로)

                    await this.contract.methods.purchaseCoffee(coffeeIndex, quantity).send({
                        from: this.accounts[this.logedUser.id],
                        value: this.web3.utils.toWei(totalPrice.toString(), 'ether'),
                    });

                    console.log(`Purchased ${quantity} units of coffee with ID ${coffeeIndex}.`);
                }

                // 주문 완료 후 처리
                this.shipAddr = '';
                this.shipTel = '';
                this.cardNum = '';
                this.cardExp = '';
                this.cardCvc = '';
                this.chBox = false;
                this.logedUser.point -= this.mPoint;
                this.logedUser.point += this.addPoint;
                this.mPoint = 0;
                sessionStorage.setItem('logeduser', JSON.stringify(this.logedUser));
                localStorage.clear();
                location.reload();
                this.show = true;

            } catch (error) {
                console.error('Transaction failed:', error);
                alert(`There was an error processing your transaction: ${error.message}`);
            }
        },
        goToProductsPage() {
            this.$router.push({ name: 'products-page' });  // ProductsPage로 이동
        }
    },
    watch:{
        coffeeItems:{
            handler(){
                this.addPoint = 0;
                this.coffeeItems.forEach((value)=>{
                    this.totalPrice += (value.eachPrice() * value.amount);
                    this.discountPrice += parseFloat(value.discount());
                })
                this.tax = (this.totalPrice - this.discountPrice)*0.05;
                this.tmpPrice = this.totalPrice - this.discountPrice + this.tax;
                this.subTotal = this.totalPrice - this.discountPrice + this.tax;
                this.addPoint = parseInt(this.tmpPrice * 0.05);
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
            console.log('logedUser:', this.logedUser);
            console.log('logedUser.id:', this.logedUser.id);
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