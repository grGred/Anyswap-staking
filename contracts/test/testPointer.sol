// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TestPointer {

    struct Struct {
        uint256 a;
        uint256 b;
    }

    function testPointer1() public pure returns(Struct memory point){
        Struct memory x = Struct({a: 1, b: 2});
        Struct memory y = x;
        y.b = 3;
        return x;
    }

    function testPointer2() public pure returns(Struct memory point){
        Struct memory x = Struct({a: 1, b: 2});
        Struct memory y = Struct({a: x.a, b: x.b});
        y.b = 3;
        return x;
    }
}
