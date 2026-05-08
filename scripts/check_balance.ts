import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const aUSDC = await ethers.getContractAt("ArcToken", "0xeD7cb772b49448027901546870425579596faaE1");
  const bal = await aUSDC.balanceOf(deployer.address);
  console.log("DEPLOYER:", deployer.address);
  console.log("aUSDC Balance:", ethers.formatUnits(bal, 6));

  const aEURC = await ethers.getContractAt("ArcToken", "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9");
  const eurBal = await aEURC.balanceOf(deployer.address);
  console.log("aEURC Balance:", ethers.formatUnits(eurBal, 18));
}

main().catch(console.error);
