export class productClass{
    pId;
    coffeeName;
    price;
    description;
    type;
    amount;
    bType;
    origin;
    pDay;
    constructor(pId, coffeeName, price, description, type, bType, origin, pDay, amount){
        this.pId = pId;
        this.coffeeName = coffeeName;
        this.price = price;
        this.description = description;
        this.type = type;
        this.bType = bType;
        this.origin = origin;
        this.pDay = pDay;
        this.amount = amount;
    }

    discount(amount, fee) {
        let Price = this.price; //0
        
        if(amount <= 4) {
            Price = 0
        }
        else if(amount > 4 && amount <=9) {
            Price = (this.price + fee) * 0.05
        }
        else if(amount > 9) {
            Price = (this.price + fee) * 0.10
        }
        
        let discount = (Price * this.amount).toFixed(2)
        return discount
    }

    eachPrice(fee) {
        let Price = this.price;
        let optionFee = 0
    
        if(fee == 0) {
            optionFee = 0;
        }
        else if(fee == 1) {
            optionFee = 1;
        } 
        else if(fee == 2) {
            optionFee = 2;
        } 
        else if(fee == 3) {
            optionFee = 3;
        }

        let Final = (Price + optionFee).toFixed(2);

        return Final
    }
    
    totalCal(fee){
        let Price = this.price; //0
        let optionFee = 0
        
        if(fee == 0) {
            optionFee = 0;
        } 
        else if(fee == 1) {
            optionFee = 1;
        }
        else if(fee == 2) {
            optionFee = 2;
        }
        else if(fee == 3) {
            optionFee = 3;
        }

        let Final = ((Price + optionFee) * this.amount).toFixed(2);

        return Final
    }

}