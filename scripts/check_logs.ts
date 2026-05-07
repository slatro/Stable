import { ethers } from "hardhat";

async function main() {
  const POOL_ADDR = "0x83F14a7474205e3eB604CdD19E4F7f9FD688Ed53"; // aUSDC Pool from dump
  const pool = await ethers.getContractAt("ArcFXAMM", POOL_ADDR);
  
  console.log(`Checking logs for Pool: ${POOL_ADDR}`);
  
  const filter = {
    address: POOL_ADDR,
    fromBlock: 0,
    toBlock: "latest",
    topics: [ethers.id("Swap(address,address,address,uint256,uint256)")]
  };
  
  const logs = await ethers.provider.getLogs(filter);
  console.log(`Total Swap logs found: ${logs.length}`);
  
  if (logs.length > 0) {
    const lastLog = logs[logs.length - 1];
    console.log(`Last Swap Transaction: ${lastLog.transactionHash} at block ${lastLog.blockNumber}`);
  }
}

main().catch(console.error);
