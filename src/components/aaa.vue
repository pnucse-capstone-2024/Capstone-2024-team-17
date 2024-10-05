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
        for (let coffee of shoppingCart) {
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
