// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;
pragma experimental ABIEncoderV2;

contract AccountStringStorage {
    // 각 주소별로 여러 개의 문자열을 저장하는 매핑 구조
    mapping(address => string[]) private accountData;

    // 데이터를 저장하는 함수
    // 각 사용자는 자신의 주소에 문자열을 추가할 수 있음
    function addString(string memory _data) public {
        accountData[msg.sender].push(_data);
    }

    // 사용자가 저장한 모든 문자열을 반환하는 함수
    function getAllStrings() public view returns (string[] memory) {
        return accountData[msg.sender];
    }

    // 저장된 문자열의 개수를 반환하는 함수
    function getStringCount() public view returns (uint256) {
        return accountData[msg.sender].length;
    }
}
