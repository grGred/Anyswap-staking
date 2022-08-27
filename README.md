# Anyswap-staking

Previously audited by:
[Blocksec](https://github.com/anyswap/Anyswap-Audit/blob/master/BlockSec/blocksec_audit_multichain_v1.0-signed.pdf)
[Peckshield](https://github.com/grGred/solidly/blob/master/audits/e456a816-3802-4384-894c-825a4177245a.pdf)

This is the bug on Multichain Staking (vote escrow contract). It is connected with calculation of voting power `at*` specific time and breaks amount of pending reward and in some cases even leads to loss of all unclaimed reward for a specific NFT, that's why I indetify it as critical.

Since Multichain has multiple stakings on different chains and market is bearish it's very likely to happen that people will not interact with one of the contracts for more than a week. This bug is connected with Solidly too. 

**Bug description:**

If contract has 0 checkpoints per week, checkpoint internal function will write multiple checkpoints to `point_history` with the same block number and different timestamp, and extrapolation of time will be broken.

**Proof of concept:**

In checkpoint function there is a for loop, before the for loop we save the latest checkpoint.

```Solidity
// initial_last_point is used for extrapolation to calculate block number
// (approximately, for *At methods) and save them
// as we cannot figure that out exactly from inside the contract
Point memory initial_last_point = last_point;
```

The problem is that this doesn't really create new variable with last point, it creates a pointer to latest point.
If `initial_last_point` is changed it means that `last_point` is changed too.

**Proof:**

Contract:
```Solidity
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
```

Test:
```
// in first case y is just a pointer to x
// if you change the variable y - variable x will be changed too
const data1 = await testData.testPointer1();
await expect(data1.b).to.be.equal(3);

// in second case y is not a pointer to x, it is a new independent variable
// if you change the variable y - variable x won't be changed
const data2 = await testData.testPointer2();
await expect(data2.b).to.be.equal(2);
```

So if there would be no points in a week, the for loop will incorrectly write checkpoint in `points_history` with one blocknumber -> multiple timestamps..

**How it will effect on reward distribution:**

People with expired locks can't claim their rewards if there are any. They will disappear.
If a person with expired lock will claim his rewards and withdraw his funds, all other users with active NFTs will lose significant amount of pending rewards. (up to 50%)
So the reward distribution will work incorrectly and their voting power will be wrong, You can't use this in governance..

**Mitigation steps:**

It would be correct to do if you redeploy the contract with:
```Solidity
// Copy all the data of last point
Point memory initial_last_point = Point({
    bias: last_point.bias,
    slope: last_point.slope,
    ts: last_point.ts, blk:
    last_point.blk
});
```
The other solution is to create backend which will call checkpoint function every day, so there would be no chance to fall into for loop and break rewards.
Tests are quite lengthy, so I recommend you to connect with me in tg, send me github nickname and see all the tests with numbers, to understand the problem.

In this repository in folder contracts the ve contract is the exact copy of your staking from BSC + i imported `hardhat console.log`, if you want to make sure that I haven't changed the contract you can just copy&paste the contract from bscscan here and rerun the tests. `veFixed` is the contract where checkpoints writes correctly.

To init the project and run the tests
```
$ npm i
$ npx hardhat test
```

In test folder I recommend using .only for each test, this way it will be much easier to understand the console logs
https://github.com/grGred/Anyswap-staking/blob/main/test/example.ts#L50

The problem line is: https://github.com/grGred/Anyswap-staking/blob/main/contracts/ve.sol#L826

It should store the latest checkpoint before the for loop, but this doesn't work correctly. Reference to this example:
https://github.com/grGred/Anyswap-staking/blob/main/contracts/test/testPointer.sol

If you run the test "Rewards after withdraw disappears for expired locks" you can see that it writes multiple checkpoint with the same blocknumber and different timestamp:

![image](https://user-images.githubusercontent.com/81467635/186917334-0cb01837-ac86-4ad3-9318-8ecc85041b9c.png)
