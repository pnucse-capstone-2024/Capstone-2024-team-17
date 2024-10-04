// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract AccountStringStorage {
    // 각 주소별로 (timestamp, txhash) 쌍들의 집합을 저장하는 매핑 구조
    struct DataEntry {
        uint256 timestamp;
        string txHash;
    }

    mapping(address => DataEntry[]) private accountData;

    // 데이터를 저장하는 함수
    // 각 사용자는 자신의 주소에 (timestamp, txhash) 쌍을 추가할 수 있음
    function addString(string memory _txHash) public {
        DataEntry memory newEntry = DataEntry({
            timestamp: block.timestamp,
            txHash: _txHash
        });
        accountData[msg.sender].push(newEntry);
    }

    // 사용자가 저장한 모든 (timestamp, txhash) 쌍을 반환하는 함수
    function getAllStrings() public view returns (DataEntry[] memory) {
        return accountData[msg.sender];
    }

    // 저장된 쌍의 개수를 반환하는 함수
    function getStringCount() public view returns (uint256) {
        return accountData[msg.sender].length;
    }
} 