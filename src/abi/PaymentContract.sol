pragma solidity ^0.4.24;

contract CoffeeShop {
    struct Coffee {
        string name;
        uint256 pricePerUnit;
        uint256 availableQuantity;
    }

    mapping(uint256 => Coffee) public coffees;
    uint256 public coffeeCount;
    address public seller;

    event CoffeeAdded(uint256 coffeeId, string name, uint256 pricePerUnit, uint256 availableQuantity);
    event CoffeePurchased(uint256 coffeeId, string name, uint256 quantity, uint256 totalPrice, address buyer);

    constructor(address _seller) public {
        seller = _seller;
        addCoffee("Guatemala", 4 ether, 100);
        addCoffee("Kenya", 3 ether, 100);
        addCoffee("Indonesia", 3.5 ether, 2000);
        addCoffee("Colombia", 5.6 ether, 100);
        addCoffee("Ethiopia", 4.8 ether, 100);
        addCoffee("Brazil", 3.5 ether, 100);
        addCoffee("Vietnam", 5.6 ether, 100);
        addCoffee("Costa", 3.5 ether, 100);
        addCoffee("Aurora", 7.4 ether, 100);
        addCoffee("Peru", 5.3 ether, 100);
        addCoffee("Las", 4 ether, 100);
        addCoffee("MURAMBA", 5.2 ether, 100);
    }

    function addCoffee(string name, uint256 pricePerUnit, uint256 availableQuantity) internal {
        coffees[coffeeCount] = Coffee(name, pricePerUnit, availableQuantity);
        emit CoffeeAdded(coffeeCount, name, pricePerUnit, availableQuantity);
        coffeeCount++;
    }

    function purchaseCoffee(uint256 coffeeId, uint256 quantity) public payable {
        require(coffeeId < coffeeCount);
        Coffee storage coffee = coffees[coffeeId];
        require(coffee.availableQuantity >= quantity);
        uint256 totalPrice = coffee.pricePerUnit * quantity;
        require(msg.value >= totalPrice);

        coffee.availableQuantity -= quantity;

        seller.transfer(totalPrice);

        emit CoffeePurchased(coffeeId, coffee.name, quantity, totalPrice, msg.sender);

        if (msg.value > totalPrice) {
            msg.sender.transfer(msg.value - totalPrice);
        }
    }

    function updateSeller(address newSeller) public {
        require(msg.sender == seller);
        seller = newSeller;
    }
}