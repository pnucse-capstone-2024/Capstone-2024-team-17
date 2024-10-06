// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract PaymentRecord {
    enum PaymentType { Buy, Sell, Refund }

    struct Payment {
        uint256 timestamp;
        PaymentType paymentType;
        string coffeeName;
        string coffeeType;
        uint256 amount;
        string txHash;
    }

    Payment[] public payments;

    event PaymentRecorded(
        uint256 indexed timestamp,
        PaymentType paymentType,
        string coffeeName,
        string coffeeType,
        uint256 amount,
        string txHash
    );

    function addPayment(
        uint256 _timestamp,
        PaymentType _paymentType,
        string memory _coffeeName,
        string memory _coffeeType,
        uint256 _amount,
        string memory _txHash
    ) public {
        payments.push(Payment({
            timestamp: _timestamp,
            paymentType: _paymentType,
            coffeeName: _coffeeName,
            coffeeType: _coffeeType,
            amount: _amount,
            txHash: _txHash
        }));

        emit PaymentRecorded(
            _timestamp,
            _paymentType,
            _coffeeName,
            _coffeeType,
            _amount,
            _txHash
        );
    }

    function getPaymentCount() public view returns (uint256) {
        return payments.length;
    }

    function getPayment(uint256 index) public view returns (
        uint256 timestamp,
        PaymentType paymentType,
        string memory coffeeName,
        string memory coffeeType,
        uint256 amount,
        string memory txHash
    ) {
        Payment storage payment = payments[index];
        return (
            payment.timestamp,
            payment.paymentType,
            payment.coffeeName,
            payment.coffeeType,
            payment.amount,
            payment.txHash
        );
    }
}
