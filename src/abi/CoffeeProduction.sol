// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract CoffeeProduction {

    enum ApprovalStatus { Registering, Approved, Rejected }

    struct Production {
        string coffeeName;
        string coffeeType;
        uint256 quantity;
        uint256 timestamp;
        uint256 price; // Added price field
        ApprovalStatus status;
        address producer;
    }

    mapping(uint256 => Production) public productions;
    uint256 public productionCount;

    event ProductionRecorded(
        uint256 productionId,
        string coffeeName,
        string coffeeType,
        uint256 quantity,
        uint256 price, // Include price in event
        uint256 timestamp,
        ApprovalStatus status,
        address indexed producer
    );

    event ProductionStatusUpdated(
        uint256 productionId,
        ApprovalStatus status
    );

    // Record a new coffee production
    function recordProduction(string memory coffeeName, string memory coffeeType, uint256 quantity, uint256 price) public {
        require(bytes(coffeeType).length > 0, "Coffee type is required.");
        require(bytes(coffeeName).length > 0, "Coffee name is required.");
        require(quantity > 0, "Quantity must be greater than 0.");
        require(price > 0, "Price must be greater than 0."); // Added price validation

        uint256 currentTimestamp = block.timestamp;

        Production memory newProduction = Production({
            coffeeName: coffeeName,
            coffeeType: coffeeType,
            quantity: quantity,
            timestamp: currentTimestamp,
            price: price, // Store price
            status: ApprovalStatus.Registering,
            producer: msg.sender
        });

        productions[productionCount] = newProduction;

        emit ProductionRecorded(
            productionCount,
            coffeeName,
            coffeeType,
            quantity,
            price, // Include price in event
            currentTimestamp,
            ApprovalStatus.Registering,
            msg.sender
        );

        productionCount++;
    }

    // Get production by ID
    function getProduction(uint256 productionId) public view returns (Production memory) {
        return productions[productionId];
    }

    // Approve production
    function approveProduction(uint256 productionId) public {
        // Implement access control as needed
        Production storage production = productions[productionId];
        production.status = ApprovalStatus.Approved;
        emit ProductionStatusUpdated(productionId, ApprovalStatus.Approved);
    }

    // Reject production
    function rejectProduction(uint256 productionId) public {
        // Implement access control as needed
        Production storage production = productions[productionId];
        production.status = ApprovalStatus.Rejected;
        emit ProductionStatusUpdated(productionId, ApprovalStatus.Rejected);
    }
}
