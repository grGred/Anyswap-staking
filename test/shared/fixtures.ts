import { Fixture } from 'ethereum-waffle';
import { ethers, network } from 'hardhat';
import { Ve, Reward, TestERC20 } from '../../typechain';

import { expect } from 'chai';
import Web3 from 'web3';

interface DeployContractFixture {
    veNFT: Ve;
    reward: Reward;
    token: TestERC20;
}

export const deployContractFixture: Fixture<DeployContractFixture> = async function (
    wallets
): Promise<DeployContractFixture> {
    const tokenFactory = await ethers.getContractFactory('TestERC20');
    let token = (await tokenFactory.deploy()) as TestERC20;
    token = token.connect(wallets[0]);

    const veNFTFactory = await ethers.getContractFactory('contracts/ve.sol:ve');
    const veNFT = (await veNFTFactory.deploy(token.address)) as Ve;

    await token.approve(veNFT.address, Web3.utils.toWei('100000000', 'ether'));
    await token.mint(wallets[0].address, Web3.utils.toWei('100000000', 'ether'));

    const RewardFactory = await ethers.getContractFactory('Reward');
    const reward = (await RewardFactory.deploy(veNFT.address, token.address)) as Reward;

    await token.mint(reward.address, Web3.utils.toWei('100000000', 'ether')); // 100 mil
    await token.approve(reward.address, Web3.utils.toWei('100000000', 'ether'));

    // const blockNum = await ethers.provider.getBlockNumber();
    // const block = await ethers.provider.getBlock(blockNum);
    // const timestamp = block.timestamp;

    // const week = 604800;
    // await reward.addEpochBatch(timestamp, week, 4, Web3.utils.toWei('100000', 'ether'));
    // await reward.addEpoch(timestamp, timestamp+week, Web3.utils.toWei('100000', 'ether'));
    // await reward.addEpoch(timestamp+week, timestamp+week*2, Web3.utils.toWei('100000', 'ether'));

    return {
        veNFT,
        reward,
        token
    };
};
