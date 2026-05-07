import { ethers } from "hardhat";

async function main() {
  const FARM_ADDR = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const USDC_ADDR = "0x3600000000000000000000000000000000000000";
  
  const farm = await ethers.getContractAt("ArcFXFarm", FARM_ADDR);
  
  console.log("Adding USDC pool to Farm...");
  // 100 alloc points, USDC address, false (don't update all pools)
  const tx = await farm.add(100, USDC_ADDR, false);
  await tx.wait();
  
  console.log("USDC Pool added! Pool ID is probably 1.");
  
  const len = await farm.poolLength();
  console.log("Current pool length: " + len);
}

main().catch(console.error);
