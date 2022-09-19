import { ethers, network, waffle } from 'hardhat';
import { deployContractFixture } from './shared/fixtures';
import { Wallet } from '@ethersproject/wallet';
import { Ve, Reward, TestERC20, TestPointer, VeFixed } from '../typechain';
import Web3 from 'web3';
import { expect } from 'chai';
import { DEADLINE } from './shared/consts';
import { BigNumber as BN, BigNumberish, ContractTransaction } from 'ethers';
const hre = require('hardhat');

const createFixtureLoader = waffle.createFixtureLoader;

describe('Tests', () => {
    let wallet: Wallet, other: Wallet;
    let token: TestERC20;
    let veNFT: Ve;
    let reward: Reward;
    let veNFTFixed: VeFixed;
    let rewardFixed: Reward;
    let testData: TestPointer;

    let loadFixture: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, other] = await (ethers as any).getSigners();
        loadFixture = createFixtureLoader([wallet, other]);
    });

    beforeEach('deploy fixture', async () => {
        ({ veNFT, veNFTFixed, reward, rewardFixed, token, testData } = await loadFixture(
            deployContractFixture
        ));
    });

    describe('#Tests', () => {
        describe('Test staking cases', () => {
            it('Check how data changes in view function', async () => {
                // in first case y is just a pointer to x
                // if you change the variable y - variable x will be changed too
                const data1 = await testData.testPointer1();
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                await expect(data1.b).to.be.equal(3);

                // in second case y is not a pointer to x, it is a new independent variable
                // if you change the variable y - variable x won't be changed
                const data2 = await testData.testPointer2();
                await expect(data2.b).to.be.equal(2);
            });

            // use `it.only(...` to see output for a specific test case
            it('Rewards after withdraw disappears for expired locks', async () => {
                let blockNum = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNum);
                let timestamp = block.timestamp;

                const week = 604800;
                await reward.addEpochBatch(timestamp, week, 5, Web3.utils.toWei('5000', 'ether'));

                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                await network.provider.send('evm_increaseTime', [Number(604800 * 3)]);
                await hre.network.provider.send('hardhat_mine', ['0x3e8']); // mine 1000 blocks

                console.log('--------------------------');
                console.log('before burn');
                // pending reward exists
                console.log('2: ', await reward.pendingReward(2, 0, 3));

                await veNFT.withdraw(1); // not only burn will break the logic. All the functions that create points

                console.log('right after burn');
                // pending reward disappeared
                // [] means there is none
                console.log('2: ', await reward.pendingReward(2, 0, 3));
            });

            it('Rewards after withdraw disappears for expired locks', async () => {
                let blockNum = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNum);
                let timestamp = block.timestamp;

                const week = 604800;
                await reward.addEpochBatch(timestamp, week, 5, Web3.utils.toWei('5000', 'ether'));

                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                await network.provider.send('evm_increaseTime', [Number(604800 * 3)]);
                await hre.network.provider.send('hardhat_mine', ['0x3e8']); // mine 1000 blocks

                console.log('--------------------------');
                console.log('before burn');
                // pending reward exists
                console.log('2: ', await reward.pendingReward(2, 0, 3));

                await veNFT.withdraw(1); // not only burn will break the logic. All the functions that create points

                console.log('right after burn');
                // pending reward disappeared
                // [] means there is none
                console.log('2: ', await reward.pendingReward(2, 0, 3));
            });

            it('Pending reward of active token decreases', async () => {
                let blockNum = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNum);
                let timestamp = block.timestamp;

                const week = 604800;
                await reward.addEpochBatch(timestamp, week, 5, Web3.utils.toWei('5000', 'ether'));

                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 10);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 10);

                await network.provider.send('evm_increaseTime', [Number(604800 * 7)]);
                await hre.network.provider.send('hardhat_mine', ['0x3e8']); // mine 1000 blocks

                console.log('--------------------------');
                console.log('before burn');
                // lets create common flow of exit, where a person claim his rewards first, and exit then
                await reward['claimReward(uint256,uint256,uint256)'](1, 0, 4);

                // reward distribution works correctly
                console.log('2: ', await reward.pendingReward(3, 0, 4));

                await veNFT.withdraw(1); // not only burn will break the logic. All the functions that create points

                console.log('right after burn');
                // pending reward of active token decreased
                // before: 1958.164
                console.log('2: ', await reward.pendingReward(3, 0, 4));
                // after: 804.45 Decreased more than 2 times! than means that incorrect checkpoint broke nft voting power for all period of the stake!
            });

            it('FIX: Pending reward of active token shouldnt decrease', async () => {
                let blockNum = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNum);
                let timestamp = block.timestamp;

                const week = 604800;
                await rewardFixed.addEpochBatch(
                    timestamp,
                    week,
                    5,
                    Web3.utils.toWei('5000', 'ether')
                );

                await veNFTFixed.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFTFixed.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                await veNFTFixed.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 10);
                await veNFTFixed.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 10);

                await network.provider.send('evm_increaseTime', [Number(604800 * 7)]);
                await hre.network.provider.send('hardhat_mine', ['0x3e8']); // mine 1000 blocks

                console.log('--------------------------');
                console.log('before burn');
                // lets create common flow of exit, where a person claim his rewards first, and exit then
                await rewardFixed['claimReward(uint256,uint256,uint256)'](1, 0, 4);
                // reward distribution works correctly
                console.log('2: ', await rewardFixed.pendingReward(3, 0, 4));

                await veNFTFixed.withdraw(1); // not only burn will break the logic. All the functions that create points

                console.log('right after burn');
                // pending reward of active token decreased
                // before: 1958.164
                console.log('2: ', await rewardFixed.pendingReward(3, 0, 4));
                // after: 804.45 Decreased more than 2 times! than means that incorrect checkpoint broke nft voting power for all period of the stake!
            });

            it('FIX: Should have rewards for expired locks', async () => {
                let blockNum = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNum);
                let timestamp = block.timestamp;

                const week = 604800;
                await rewardFixed.addEpochBatch(
                    timestamp,
                    week,
                    5,
                    Web3.utils.toWei('5000', 'ether')
                );

                await veNFTFixed.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFTFixed.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                await network.provider.send('evm_increaseTime', [Number(604800 * 3)]);
                await hre.network.provider.send('hardhat_mine', ['0x3e8']); // mine 1000 blocks

                console.log('--------------------------');
                console.log('before burn');
                // pending reward exits
                console.log('2: ', await rewardFixed.pendingReward(2, 0, 3));

                await veNFTFixed.withdraw(1);

                console.log('right after burn');
                // pending reward still exists
                console.log('2: ', await rewardFixed.pendingReward(2, 0, 3));
            });

            it.only('Merge nft bug', async () => {
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                console.log('before merge: ', (await veNFT.supply()).toString());

                await veNFT.merge(2, 3);

                console.log('right after merge: ', (await veNFT.supply()).toString());

                console.log(
                    'amount of tokens on the contract: ',
                    (await token.balanceOf(veNFT.address)).toString()
                );
            });
        });
    });
});
