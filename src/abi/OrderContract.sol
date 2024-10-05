// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract OrderContract {
    enum OrderStatus { Pending, Approved, Rejected }

    struct TxInfo {
        string txHash;
        uint256 quantity;
        uint256 timestamp;
    }

    struct Order {
        uint256 orderId;
        string coffeeName;
        string beanType;
        uint256 quantity;
        uint256 price;
        TxInfo[] txInfos;
        address buyer;
        OrderStatus status;
    }

    Order[] public orders;
    address public owner;

    event OrderCreated(
        uint256 orderId,
        address buyer,
        string coffeeName,
        string beanType,
        uint256 quantity,
        uint256 price,
        TxInfo[] txInfos
    );
    event OrderApproved(uint256 orderId);
    event OrderRejected(uint256 orderId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createOrder(
        string memory _coffeeName,
        string memory _beanType,
        uint256 _quantity,
        uint256 _price,
        TxInfo[] memory _txInfos
    ) public {
        uint256 orderId = orders.length;
        Order storage newOrder = orders.push();
        newOrder.orderId = orderId;
        newOrder.coffeeName = _coffeeName;
        newOrder.beanType = _beanType;
        newOrder.quantity = _quantity;
        newOrder.price = _price;
        newOrder.buyer = msg.sender;
        newOrder.status = OrderStatus.Pending;

        for (uint256 i = 0; i < _txInfos.length; i++) {
            newOrder.txInfos.push(
                TxInfo({
                    txHash: _txInfos[i].txHash,
                    quantity: _txInfos[i].quantity,
                    timestamp: _txInfos[i].timestamp
                })
            );
        }

        emit OrderCreated(
            orderId,
            msg.sender,
            _coffeeName,
            _beanType,
            _quantity,
            _price,
            newOrder.txInfos
        );
    }

    function approveOrder(uint256 _orderId) public onlyOwner {
        require(_orderId < orders.length, "Invalid orderId");
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Pending, "Order is not pending");
        order.status = OrderStatus.Approved;
        emit OrderApproved(_orderId);
    }

    function rejectOrder(uint256 _orderId) public onlyOwner {
        require(_orderId < orders.length, "Invalid orderId");
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Pending, "Order is not pending");
        order.status = OrderStatus.Rejected;
        emit OrderRejected(_orderId);
    }

    function getOrder(uint256 _orderId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            uint256,
            uint256,
            address,
            OrderStatus,
            TxInfo[] memory
        )
    {
        require(_orderId < orders.length, "Invalid orderId");
        Order storage order = orders[_orderId];
        return (
            order.orderId,
            order.coffeeName,
            order.beanType,
            order.quantity,
            order.price,
            order.buyer,
            order.status,
            order.txInfos
        );
    }

    function getOrderCount() public view returns (uint256) {
        return orders.length;
    }
}
