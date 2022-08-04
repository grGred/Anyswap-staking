import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import {Reward, Reward__factory, TestERC20, Ve} from "../typechain";
import Web3 from "web3";
const hre = require("hardhat");

async function main() {
  const tokenFactory = await ethers.getContractFactory("TestERC20");
  const veNFTFactory = await ethers.getContractFactory("contracts/ve.sol:ve");
  const RewardFactory = await ethers.getContractFactory("Reward");

  // ve 0x1AFC4048A0D1Ecd794f68F2e6a18a27f6594E7F0
  // reward 0x53d552eC66a2D1Cf22ae953B8E21D06aC18d9da9

  let token = (await tokenFactory.attach(
      '0xd452d01C6348D3d5B35FA1d5500d23F8Ae65D6eA'
    )) as TestERC20;

  let reward1 = (await RewardFactory.attach(
      '0x53d552eC66a2D1Cf22ae953B8E21D06aC18d9da9'
    )) as Reward;

  let veNFT = (await veNFTFactory.attach(
      '0x1AFC4048A0D1Ecd794f68F2e6a18a27f6594E7F0'
    )) as Ve;

  await token.mint('0x53d552eC66a2D1Cf22ae953B8E21D06aC18d9da9', Web3.utils.toWei("10000000", "ether")); // 100 mil

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  await token.approve(veNFT.address, Web3.utils.toWei("100000000", "ether"));

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  const blockNum = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNum);
  const timestamp = block.timestamp;

  const week = 5 * 60;
  await reward1.addEpochBatch(
    timestamp + 30,
    week,
    10,
    Web3.utils.toWei("10000", "ether")
  );

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  await veNFT.create_lock(Web3.utils.toWei('10', 'ether'), 600);

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  await veNFT.create_lock(Web3.utils.toWei('10', 'ether'), 600);

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 150000));

  await veNFT.checkpoint();

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 150000));

  await veNFT.checkpoint();

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 150000));

  await veNFT.checkpoint();

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 150000));

  await veNFT.checkpoint();

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 150000));

  await veNFT.checkpoint();

  await new Promise((r) => setTimeout(r, 10000));

  await reward1["claimReward(uint256,uint256,uint256)"](1,0,5);

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  await veNFT.withdraw(1);

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  await reward1["claimReward(uint256,uint256,uint256)"](2,0,5);

  // eslint-disable-next-line promise/param-names
  await new Promise((r) => setTimeout(r, 10000));

  await veNFT.withdraw(1);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
