<template>
    <div>
        <table>
            <thead v-if="userShoppingCart.length !== 0">
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
                <tr v-for="(coffee, idx) in userShoppingCart" :key="idx">
                <td scope="row">{{ coffee.coffeeName }}</td>
                <td v-if="coffee.origin !== ''">{{ coffee.origin }}</td>
                <td v-else>-</td>
                <td v-if="coffee.pDay !== ''">{{ coffee.pDay }}</td>
                <td v-else>-</td>
                <td v-if="coffee.bType !== ''">{{ coffee.bType }}</td>
                <td>{{ calculateEachPrice(coffee.price, coffee.bType) }}</td>
                <td>{{ coffee.amount }}</td>
                <td>{{ calculateWhole(coffee.price, coffee.bType, coffee.amount) }}</td>
                <td><button @click="remItem(coffee.pId, coffee.bType)">x</button></td>
                </tr>
            </tbody>
        </table>
        <article>
            <article>
                <h2 style="margin-top: 40px; margin-left: -6%;">Order Details</h2>
            </article>
            <section>
                <ul v-for="(coffee,idx) in userShoppingCart" :key="idx">
                    <li>
                        <p><span style="margin-left: 10px;">{{coffee.coffeeName}}</span> x {{coffee.amount}}(100g, {{coffee.bType}})</p>
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
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'CartTableCompo',
    data() {
        return {
            subTotal: 0,
            totalPrice: 0,
            commision: 0,
            discountPrice: 0,
            logedUser: '',
            loggedUser: JSON.parse(sessionStorage.getItem('logeduser')),
            userID: 0,
            userBalance: 0,
            shipAddr: '',
            shipTel: '',
            chBox: false,
            show: false,
            web3: null,
            contract: null,
            accounts: [],
            contractAddress: '0xa6A96Be3f5CbBCa1Edf1533c8A3e3b61A2b1a2eD' 
        }
    },

    computed: {
        ...mapGetters(['getShoppingCart']),
        userShoppingCart() {
            const userId = this.logedUser.id;
            return this.getShoppingCart(userId);
        },
    },

    methods: {
        ...mapActions(['updateConfirmedProductionQuantity', 'deleteCoffeeShoppingCart', 'clearCoffeeShoppingCart']),
        
        calculateOptionFee(feeType) {
            switch (feeType) {
                case 'Whole beans':
                    return 0;
                case 'Ground':
                    return 1;
                case 'Drip Package':
                    return 2;
                case 'Capsule':
                    return 3;
                default:
                    return 0;
            }
        },
        calculateEachPrice(price, feeType) {
            const optionFee = this.calculateOptionFee(feeType);
            return (price + optionFee).toFixed(2);
        },
        calculateWhole(price, feeType, amount) {
            const eachPrice = this.calculateEachPrice(price, feeType);
            return (eachPrice * amount).toFixed(2);
        },
        calculateDiscount(price, feeType, amount) {
            const eachPrice = this.calculateEachPrice(price, feeType);
            let discountRate = 0;
            if (amount > 9) {
                discountRate = 0.10;
            } else if (amount > 4) {
                discountRate = 0.05;
            }
            const discount = (eachPrice * amount * discountRate).toFixed(2);
            return discount;
        },
        
        async loadUserBalance() {
            try {
                this.accounts = await this.web3.eth.getAccounts();
                if (this.accounts.length === 0) {
                    throw new Error('No accounts found');
                }
                const userId = this.logedUser.id;
                if (!this.accounts[userId]) {
                    throw new Error('Invalid user ID or no associated account');
                }
                const balance = await this.web3.eth.getBalance(this.accounts[userId]);
                this.userBalance = parseFloat(this.web3.utils.fromWei(balance, 'ether')).toFixed(2); // 잔액을 ETH로 변환하여 소수점 4자리까지만 표시
            } 
            catch (error) {
                console.error('Error fetching ETH balance:', error.message);
            }
        },

        remItem(pid, bType) {
            const userId = this.logedUser.id;
            const shoppingCart = this.getShoppingCart(userId);

            const index = shoppingCart.findIndex((item) => item.pId === pid && item.bType === bType);
            if (index !== -1) {
                this.deleteCoffeeShoppingCart({ userId, index });
                this.totalPrice = 0;
                this.discountPrice = 0;
            }
        },

        goHome() {
            this.$router.push({ name: 'products-page' });
        },

        async orderFunc() {
            const userId = this.logedUser.id;
            const shoppingCart = this.getShoppingCart(userId);

            if (!this.chBox) {
                alert("Please agree to the terms and conditions.");
                return;
            }

            if (shoppingCart.length == 0) {
                alert("Please add your product.");
                return;
            }

            try {
                for (let coffee of shoppingCart) {
                    const quantity = coffee.amount;
                    const coffeeIndex = parseInt(coffee.pId); // pId를 정수로 변환하여 사용
                    const totalUnitPrice = this.calculateWhole(coffee.price, coffee.bType, coffee.amount);
                    const totalUnitPriceWei = this.web3.utils.toWei(totalUnitPrice.toString(), 'ether');

                    // 스마트 컨트랙트 메서드 호출로 트랜잭션을 발생시킵니다.
                    await this.contract.methods.purchaseCoffee(coffeeIndex, quantity).send({
                        from: this.accounts[this.logedUser.id],
                        to: this.accounts[coffeeIndex + 10],
                        value: totalUnitPriceWei,
                    });

                    // 주문한 수량만큼 재고 감소 처리
                    const coffeeName = coffee.coffeeName;
                    const beanType = coffee.bType;
                    const orderedAmount = quantity;
                    const product = this.$store.getters.getConfirmedProductions.find(
                        (item) => item.coffeeName === coffeeName && item.beanType === beanType
                    );

                    if (product) {
                        const newQuantity = ((product.quantity * 10) - orderedAmount) / 10;
                        if (newQuantity < 0) {
                            alert(`The stock of ${coffeeName} (${beanType}) is insufficient`);
                            return;
                        }

                        // Vuex의 action을 사용하여 재고 수량을 업데이트합니다.
                        this.updateConfirmedProductionQuantity({
                            coffeeName: coffeeName,
                            beanType: beanType,
                            newQuantity: newQuantity,
                        });
                    } else {
                        alert(`${coffeeName} (${beanType}) cannot be found`);
                        return;
                    }
                }

                if (!this.loggedUser.manager) {
                    const commissionWei = this.web3.utils.toWei(this.commision.toString(), 'ether');
                    await this.web3.eth.sendTransaction({
                        from: this.accounts[this.logedUser.id],
                        to: this.accounts[23],
                        value: commissionWei,
                    });
                }

                // 모든 구매가 완료된 후 장바구니에서 아이템을 제거합니다.
                this.clearCoffeeShoppingCart(userId);

                // 주문 정보 초기화
                this.shipAddr = '';
                this.shipTel = '';
                this.chBox = false;

                sessionStorage.setItem('logeduser', JSON.stringify(this.logedUser));

                // 결제 완료 후 알림 및 페이지 이동
                alert('Payment has been completed. You will be redirected to the homepage.');
                this.$router.push({ name: 'home-page' });

                this.show = true;
            } 
            catch (error) {
                console.error('Transaction failed:', error);
                alert(`There was an error processing your transaction: ${error.message}`);
            }
        },
    },

    watch: {
        userShoppingCart: {
            handler() {
                this.totalPrice = 0;
                this.discountPrice = 0;
                this.userShoppingCart.forEach((coffee) => {
                    this.totalPrice += parseFloat(this.calculateWhole(coffee.price, coffee.bType, coffee.amount));
                    this.discountPrice += parseFloat(this.calculateDiscount(coffee.price, coffee.bType, coffee.amount));
                });
                if (this.loggedUser.manager) {
                    this.commision = 0;
                } else {
                    this.commision = (this.totalPrice - this.discountPrice) * 0.30;
                }
                this.subTotal = this.totalPrice - this.discountPrice + this.commision;
            },
            deep: true,
            immediate: true,
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