<template>
    <div>
        <table>
            <thead v-if="this.coffeeItems.size!=0">
                <tr>
                    <th>Product</th>
                    <th>-</th>
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
                    <td v-if="coffee[1].bType !== ''">{{getBeanType(coffee[1].bType)}}</td>
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
                    <li v-if="coffee[1].type !== 'Beverage'">
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
            contractAddress: '0xa6A96Be3f5CbBCa1Edf1533c8A3e3b61A2b1a2eD'
        }
    },
    methods:{
        getBeanType(fee) {
            switch (fee) {
                case 0:
                    return "Whole beans";
                case 1:
                    return "Ground";
                case 2:
                    return "Drip Package";
                case 3:
                    return "Capsule";
                default:
                    return "-";
            }
        },
        
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
    // 체크박스가 체크되어 있는지 확인
        if (!this.chBox) {
            alert("Please agree to the terms and conditions.");
            event.preventDefault();
            return;
        }

        try {
            // 각 커피 항목에 대해 트랜잭션 수행
            for (let [coffeeId, coffee] of this.coffeeItems.entries()) {
            const quantity = coffee.amount;
            const coffeeIndex = parseInt(coffeeId);
            const totalUnitPrice = coffee.totalCal(coffee.bType); // 총 가격 계산 (ETH로)
            const totalUnitPriceWei = this.web3.utils.toWei(totalUnitPrice.toString(), 'ether');

            // coffeeId에 따른 판매자 주소 결정
            let toAddress = '';
            switch (coffeeIndex) {
                case 0:
                    toAddress = '0x17c317173BD04D08C507Ee30DAD391988a6b9D6C';
                    break;
                case 1:
                    toAddress = '0x42FD0ab02A2749cdEABB6918b43b474e3612A3ea';
                    break;
                case 2:
                    toAddress = '0x9aa2AAd79C3C659282041089137895662c6252Dc';
                    break;
                case 3:
                    toAddress = '0xa5CaC98d194603a11ce895BC9F10667A7434f8E2';
                    break;
                case 4:
                    toAddress = '0x8a028F059e8633B37Bad57d5Da66b2eCdDf7f044';
                    break;
                case 5:
                    toAddress = '0xE0641e51c20BdBECAE99783Fec963BC4c0374841';
                    break;
                case 6:
                    toAddress = '0x75DC5748c40Ac457992914F5aCbAB18e62EBAC90';
                    break;
                case 7:
                    toAddress = '0x2126b3439340D30715275e7853DA75ea3c0Ed6Ff';
                    break;
                case 8:
                    toAddress = '0xBcaaA6d7935ADA652d89B0383dC6AfC51E7169a6';
                    break;
                case 9:
                    toAddress = '0x05e92401E71f0FE02e97262dd4d10f9b324c9659';
                    break;
                case 10:
                    toAddress = '0xAEA5F25890d7a19558C91929e68caB7D50527BF4';
                    break;
                case 11:
                    toAddress = '0x49B1E2b0CC923c8A437c952CF789Dbd7B3fcca6c';
                    break;
                default:
                    console.error(`Invalid coffeeId: ${coffeeId}`);
                    continue;
            }

            // 트랜잭션 발생
            await this.contract.methods.purchaseCoffee(coffeeIndex, quantity).send({
                from: this.accounts[this.logedUser.id],
                to: toAddress,  // 각 coffeeId에 맞는 주소로 송금
                value: totalUnitPriceWei,
            });

            console.log(`Purchased ${quantity} units of coffee with ID ${coffeeIndex}, sent to ${toAddress}.`);
        }

            // 주문 완료 후 커미션 차감
            const commissionWei = this.web3.utils.toWei(this.commision.toString(), 'ether');
            await this.web3.eth.sendTransaction({
                from: this.accounts[this.logedUser.id],
<<<<<<< HEAD
                // 커미션을 받을 계정 주소 to: this.contractAddress,
                to: '0xE860132058426bd858f2F3dFd17DA1A09561973b',  
=======
                to: '0x9dbc4c4B6C5Ef959e72B95dC3b86157cA8a90ec7',  // 커미션을 받을 계정 주소
>>>>>>> f4fd85adbe2ec7a640a994b3a3b6d8a43bcc1920
                value: commissionWei,
            });

            console.log(`Commission of ${this.commision} ETH sent to contract.`);

            // 주문 완료 후 처리
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
                this.commision = (this.totalPrice - this.discountPrice)*0.30;
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