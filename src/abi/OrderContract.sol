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
        address buyer;
        OrderStatus status;
        TxInfo[] txInfos;
    }

    Order[] public orders;
    address public owner;
    address public manager; // Add manager address

    event OrderCreated(
        uint256 orderId,
        address buyer,
        string coffeeName,
        string beanType,
        uint256 quantity,
        uint256 price
    );
    event OrderApproved(uint256 orderId);
    event OrderRejected(uint256 orderId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only the manager can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setManager(address _manager) public onlyOwner {
        manager = _manager;
    }

    function createOrder(
        string memory _coffeeName,
        string memory _beanType,
        uint256 _quantity,
        uint256 _price,
        string[] memory _txHashes,
        uint256[] memory _txQuantities,
        uint256[] memory _txTimestamps
    ) public {
        require(
            _txHashes.length == _txQuantities.length &&
            _txHashes.length == _txTimestamps.length,
            "TxInfo arrays must have the same length"
        );

        uint256 orderId = orders.length;
        Order storage newOrder = orders.push();
        newOrder.orderId = orderId;
        newOrder.coffeeName = _coffeeName;
        newOrder.beanType = _beanType;
        newOrder.quantity = _quantity;
        newOrder.price = _price;
        newOrder.buyer = msg.sender;
        newOrder.status = OrderStatus.Pending;

        for (uint256 i = 0; i < _txHashes.length; i++) {
            newOrder.txInfos.push(
                TxInfo({
                    txHash: _txHashes[i],
                    quantity: _txQuantities[i],
                    timestamp: _txTimestamps[i]
                })
            );
        }

        emit OrderCreated(
            orderId,
            msg.sender,
            _coffeeName,
            _beanType,
            _quantity,
            _price
        );
    }

    function approveOrder(uint256 _orderId) public onlyManager {
        require(_orderId < orders.length, "Invalid orderId");
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.Pending, "Order is not pending");
        order.status = OrderStatus.Approved;
        emit OrderApproved(_orderId);
    }

    function rejectOrder(uint256 _orderId) public onlyManager {
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
            string[] memory,
            uint256[] memory,
            uint256[] memory
        )
    {
        require(_orderId < orders.length, "Invalid orderId");
        Order storage order = orders[_orderId];

        uint256 txCount = order.txInfos.length;
        string[] memory txHashes = new string[](txCount);
        uint256[] memory txQuantities = new uint256[](txCount);
        uint256[] memory txTimestamps = new uint256[](txCount);

        for (uint256 i = 0; i < txCount; i++) {
            TxInfo storage txInfo = order.txInfos[i];
            txHashes[i] = txInfo.txHash;
            txQuantities[i] = txInfo.quantity;
            txTimestamps[i] = txInfo.timestamp;
        }

        return (
            order.orderId,
            order.coffeeName,
            order.beanType,
            order.quantity,
            order.price,
            order.buyer,
            order.status,
            txHashes,
            txQuantities,
            txTimestamps
        );
    }

    function getOrderCount() public view returns (uint256) {
        return orders.length;
    }
}
