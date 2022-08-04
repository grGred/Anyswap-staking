import { ethers, network, waffle } from 'hardhat';
import { deployContractFixture } from './shared/fixtures';
import { Wallet } from '@ethersproject/wallet';
import {Ve, Reward, TestERC20, TestPointer} from '../typechain';
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
    let testData: TestPointer;

    let loadFixture: ReturnType<typeof createFixtureLoader>;

    before('create fixture loader', async () => {
        [wallet, other] = await (ethers as any).getSigners();
        loadFixture = createFixtureLoader([wallet, other]);
    });

    beforeEach('deploy fixture', async () => {
        ({ veNFT, reward, token, testData } = await loadFixture(deployContractFixture));
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
                const data2 = await testData.testPointer1();
                await expect(data2.b).to.be.equal(2);
            });

            it('Should have rewards after witdhraw', async () => {
                let blockNum = await ethers.provider.getBlockNumber();
                let block = await ethers.provider.getBlock(blockNum);
                let timestamp = block.timestamp;

                const week = 604800;
                await reward.addEpochBatch(timestamp, week, 5, Web3.utils.toWei('5000', 'ether'));

                await veNFT.create_lock(Web3.utils.toWei('10', 'ether'), 604800 * 2);
                await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);

                await network.provider.send('evm_increaseTime', [Number(604800 * 3)]);
                await network.provider.send('evm_mine');

                console.log('before burn');
                // console.log('2: ', await reward.pendingReward(2, 0, 3));

                await veNFT.withdraw(1);

                console.log('right after burn');
                console.log('2: ', await reward.pendingReward(2, 0, 3));
            });

            // it('Should have rewards after witdhraw but with 3 tokens', async () => {
            //     let blockNum = await ethers.provider.getBlockNumber();
            //     let block = await ethers.provider.getBlock(blockNum);
            //     let timestamp = block.timestamp;
            //
            //     const week = 604800;
            //     await reward.addEpochBatch(
            //         timestamp + 20,
            //         week,
            //         5,
            //         Web3.utils.toWei('5000', 'ether')
            //     );
            //
            //     await veNFT.create_lock(Web3.utils.toWei('10', 'ether'), 604800);
            //     await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
            //     await veNFT.create_lock(Web3.utils.toWei('1000', 'ether'), 604800 * 2);
            //
            //     await network.provider.send('evm_increaseTime', [Number(604800)]);
            //     await network.provider.send('evm_mine');
            //
            //     let amountBefore = await token.balanceOf(wallet.address);
            //     await reward['claimReward(uint256,uint256,uint256)'](1, 0, 1);
            //     console.log(Number(amountBefore) - Number(await token.balanceOf(wallet.address)));
            // });
        });
    });
});
