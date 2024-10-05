<template>
    <div>
        <table>
            <thead v-if="userShoppingCart.length !== 0">
                <tr>
                    <th>Product</th>
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
                        <p>
                            <span style="margin-left: 10px;">- Origin: {{ getOrigin(coffee.coffeeName) }}</span>
                        </p>
                        <p><span style="margin-left: 10px;">- Production day:</span></p>
                        <!-- Display P-days and quantities -->
                        <ul>
                            <li v-for="(tx, txIdx) in coffee.txInfo" :key="txIdx">
                                {{ txIdx + 1 }}. {{ formatTimestamp(tx.timestamp) }}, {{ tx.quantity }} units
                            </li>
                        </ul>
                    </li>
                </ul>
                <section>
                    <h3 style="margin-top: 40px;">Total: {{this.subTotal.toFixed(2)}}<small>({{this.totalPrice.toFixed(2)}}(price) - {{this.discountPrice.toFixed(2)}}(discount))</small></h3>
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
                    <button @click="orderFunc" type="button">Place order</button>
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
import coffeeData from '../../public/data/coffee.json'; // Import coffee.json
import OrderContract from '../abi/OrderContract.json'; // Updated ABI

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
            contractAddress: '0xa6A96Be3f5CbBCa1Edf1533c8A3e3b61A2b1a2eD',
            orderContract: null,
            orderContractAddress: '0xf5442B9Ea92df41ecf5379a6c6A460363a025c63',
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
        
        
        getOrigin(coffeeName) {
            const coffeeItem = coffeeData.find(item => item.coffeeName === coffeeName);
            return coffeeItem ? coffeeItem.origin : 'Unknown';
        },
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
        formatTimestamp(unixTimestamp) {
            const date = new Date(unixTimestamp * 1000);
            return date.toLocaleString('en-US');
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

            if (shoppingCart.length == 0) {
                alert("Please add your product.");
                return;
            }
            if (!this.shipAddr || !this.shipTel) {
                alert('Address and phone number are required.');
                return;
            }
            if (!this.chBox) {
                alert("Please agree to the terms and conditions.");
                return;
            }

            try {
                // Existing payment processing code
                 for (let coffee of shoppingCart) {
                    const orderInfo = {
                        shipAddr: this.shipAddr,
                        shipTel: this.shipTel,
                        items: shoppingCart.map(coffee => ({
                            coffeeName: coffee.coffeeName,
                            bType: coffee.bType,
                            amount: coffee.amount,
                        })),
                        };
                    const quantity = Number(coffee.amount);
                    const coffeeName = coffee.coffeeName;
                    const beanType = coffee.bType;
                    const orderedAmount = quantity;

                    const product = this.$store.getters.getConfirmedProductions.find(
                        (item) => item.coffeeName === coffeeName && item.beanType === beanType
                    );

                    if (product) {
                        // Update the TxInfo in FIFO order
                        let remainingAmount = orderedAmount;
                        const updatedTxInfo = [];
                        for (const txInfo of product.TxInfo) {
                        if (remainingAmount <= 0) {
                            updatedTxInfo.push(txInfo);
                            continue;
                        }
                        const availableQuantity = Number(txInfo.quantity);
                        const usedQuantity = Math.min(availableQuantity, remainingAmount);
                        const newQuantity = availableQuantity - usedQuantity;

                        if (newQuantity > 0) {
                            updatedTxInfo.push({
                            txHash: txInfo.txHash,
                            quantity: newQuantity,
                            timestamp: txInfo.timestamp,
                            });
                        }
                        remainingAmount -= usedQuantity;
                        }
                        if (remainingAmount > 0) {
                        alert(`Insufficient stock for ${coffeeName} (${beanType})`);
                        return;
                        }

                        // Update the product's TxInfo and quantity in the Vuex store
                        const newTotalQuantity = updatedTxInfo.reduce((sum, tx) => sum + Number(tx.quantity), 0);
                        this.$store.dispatch('updateConfirmedProductionAfterOrder', {
                        coffeeName,
                        beanType,
                        newQuantity: newTotalQuantity,
                        newTxInfo: updatedTxInfo,
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

                // After successful payment, create orders in the smart contract
                for (let coffee of shoppingCart) {
                const coffeeName = coffee.coffeeName;
                const beanType = coffee.bType;
                const coffeeIndex = parseInt(coffee.pId); // pId를 정수로 변환하여 사용
                const quantity = Number(coffee.amount);
                const priceInEth = parseFloat(this.calculateWhole(coffee.price, coffee.bType, coffee.amount));
                const priceInWei = this.web3.utils.toWei(priceInEth.toString(), 'ether');

                 // 스마트 컨트랙트 메서드 호출로 트랜잭션을 발생시킵니다.
                 await this.contract.methods.purchaseCoffee(coffeeIndex, quantity).send({
                        from: this.accounts[this.logedUser.id],
                        to: this.accounts[22],
                        value:priceInWei,
                    });


                // Prepare txInfo data
                const txInfos = coffee.txInfo || [];
                const txHashes = txInfos.map(tx => tx.txHash);
                const txQuantities = txInfos.map(tx => Number(tx.quantity));
                const txTimestamps = txInfos.map(tx => Number(tx.timestamp));

                // Ensure arrays are of the same length
                if (txHashes.length !== txQuantities.length || txHashes.length !== txTimestamps.length) {
                    console.error('TxInfo arrays must have the same length');
                    continue;
                }

                // Call createOrder on the contract
                const estimatedGas = await this.orderContract.methods
                    .createOrder(coffeeName, beanType, quantity, priceInWei, txHashes, txQuantities, txTimestamps)
                    .estimateGas({ from: this.accounts[userId] });

                await this.orderContract.methods
                    .createOrder(coffeeName, beanType, quantity, priceInWei, txHashes, txQuantities, txTimestamps)
                    .send({ from: this.accounts[userId], gas: estimatedGas });
                }

                // Clear shopping cart after successful order creation
                this.clearCoffeeShoppingCart(userId);

                // Reset form fields
                this.shipAddr = '';
                this.shipTel = '';
                this.chBox = false;

                alert('Order placed successfully. You will be redirected to the homepage.');
                this.$router.push({ name: 'home-page' });
            } catch (error) {
                console.error('Transaction failed:', error);
                alert(`There was an error processing your transaction: ${error.message}`);
            }
            },
            getAvailableTxInfo(coffeeName, beanType, amountNeeded) {
                const product = this.$store.getters.getConfirmedProductions.find(
                (item) => item.coffeeName === coffeeName && item.beanType === beanType
                );

                if (!product) {
                alert(`${coffeeName} (${beanType}) is not available`);
                return [];
                }

                let remainingAmount = amountNeeded;
                const selectedTxInfos = [];

                for (const txInfo of product.TxInfo) {
                if (remainingAmount <= 0) break;
                const availableQuantity = Number(txInfo.quantity);
                const usedQuantity = Math.min(availableQuantity, remainingAmount);

                selectedTxInfos.push({
                    txHash: txInfo.txHash,
                    quantity: usedQuantity,
                    timestamp: txInfo.timestamp,
                });

                remainingAmount -= usedQuantity;
                }

                if (remainingAmount > 0) {
                alert(`Not enough stock for ${coffeeName} (${beanType})`);
                return [];
                }

                return selectedTxInfos;
            },

            addToCart(coffee) {
                const userId = this.logedUser.id;
                const amountNeeded = Number(coffee.amount);
                const txInfos = this.getAvailableTxInfo(coffee.coffeeName, coffee.bType, amountNeeded);

                if (txInfos.length === 0) {
                return; // Not enough stock
                }

                const product = {
                pId: coffee.pId,
                coffeeName: coffee.coffeeName,
                bType: coffee.bType,
                price: coffee.price,
                amount: coffee.amount,
                txInfo: txInfos,
                };

                this.$store.dispatch('addCoffeeShoppingCart', { userId, production: product });
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
                
                this.subTotal = this.totalPrice - this.discountPrice;
            },
            deep: true,
            immediate: true,
        },
    },
    async mounted() {
        this.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:7545'));
        this.contract = new this.web3.eth.Contract(CoffeeContract.abi, this.contractAddress);
        this.orderContract = new this.web3.eth.Contract(OrderContract.abi, this.orderContractAddress); // Initialize OrderContract

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
