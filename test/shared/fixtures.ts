import { Fixture } from 'ethereum-waffle';
import { ethers, network } from 'hardhat';
import { Ve, Reward, TestERC20, TestPointer } from '../../typechain';

import Web3 from 'web3';

interface DeployContractFixture {
    veNFT: Ve;
    reward: Reward;
    token: TestERC20;
    testData: TestPointer;
}

export const deployContractFixture: Fixture<DeployContractFixture> = async function (
    wallets
): Promise<DeployContractFixture> {
    const testPointerFactory = await ethers.getContractFactory('TestPointer');
    let testData = (await testPointerFactory.deploy()) as TestPointer;

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

    return {
        veNFT,
        reward,
        token,
        testData
    };
};
