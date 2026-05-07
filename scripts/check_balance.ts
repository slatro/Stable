import { ethers } from "hardhat";
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("BALANCE:" + ethers.formatEther(balance));
}
main().catch(console.error);
