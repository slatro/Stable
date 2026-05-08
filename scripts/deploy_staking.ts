import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Staking Infrastructure to REAL Native USDC with account:", deployer.address);

  // 1. Official Arc Testnet USDC Address
  const nativeUsdcAddr = "0x3600000000000000000000000000000000000000";

  // 2. Deploy Staking Contract (astUSDC)
  const ArcFXStaking = await ethers.getContractFactory("ArcFXStaking");
  const staking = await ArcFXStaking.deploy(nativeUsdcAddr);
  await staking.waitForDeployment();
  const stakingAddr = await staking.getAddress();
  console.log("Staking Contract Deployed:", stakingAddr);

  // 3. Update Frontend Config
  const configPath = path.join(__dirname, "../frontend/src/config/contracts.ts");
  let content = fs.readFileSync(configPath, "utf-8");

  // Ensure USDC_NATIVE is the real one and update astUSDC/STAKING_CONTRACT
  content = content.replace(/USDC_NATIVE: ".*"/, `USDC_NATIVE: "${nativeUsdcAddr}"`);
  content = content.replace(/astUSDC: ".*"/, `astUSDC: "${stakingAddr}"`);
  
  if (!content.includes("STAKING_CONTRACT")) {
    content = content.replace(/ARC_POINTS: ".*",/, (match) => `${match}\n  STAKING_CONTRACT: "${stakingAddr}",`);
  } else {
    content = content.replace(/STAKING_CONTRACT: ".*",/, `STAKING_CONTRACT: "${stakingAddr}",`);
  }

  fs.writeFileSync(configPath, content);
  console.log("Frontend config updated with REAL Native USDC and NEW Staking contract.");
}

main().catch(console.error);
