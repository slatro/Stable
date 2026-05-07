import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatUnits(balance, 18), "USDC");

  // 1. Deploy ArcToken (reward token)
  console.log("\nDeploying ArcToken...");
  const ArcToken = await ethers.getContractFactory("ArcToken");
  const arc = await ArcToken.deploy();
  await arc.waitForDeployment();
  const arcAddress = await arc.getAddress();
  console.log("ArcToken deployed to:", arcAddress);

  // 2. Deploy ArcFXFarm with 1 ARC per second reward
  console.log("\nDeploying ArcFXFarm...");
  const arcPerSecond = ethers.parseUnits("1", 18);
  const ArcFXFarm = await ethers.getContractFactory("ArcFXFarm");
  const farm = await ArcFXFarm.deploy(arcAddress, arcPerSecond);
  await farm.waitForDeployment();
  const farmAddress = await farm.getAddress();
  console.log("ArcFXFarm deployed to:", farmAddress);

  // 3. Fund the Farm with 1M ARC for rewards
  console.log("\nFunding Farm with 1M ARC...");
  const fundTx = await arc.transfer(farmAddress, ethers.parseUnits("1000000", 18));
  await fundTx.wait();
  console.log("Farm funded.");

  // 4. Add aUSDC pool (pid = 0)
  // aUSDC is the primary staking token
  const aUSDC = "0x4e169f3256b02A4705E03Fd97312145a3513a153";
  console.log("\nAdding aUSDC pool (pid=0)...");
  const addTx = await farm.add(100, aUSDC, false);
  await addTx.wait();
  console.log("aUSDC pool added as pid=0");

  // Verify
  const poolLen = await farm.poolLength();
  console.log("Total pools:", poolLen.toString());

  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("ArcToken:", arcAddress);
  console.log("ArcFXFarm:", farmAddress);
  console.log("========================================");
  console.log("UPDATE contracts.ts FARM address to:", farmAddress);
}

main().catch(console.error);
