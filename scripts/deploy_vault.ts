import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Deploy AstUSDC receipt token
  console.log("\nDeploying AstUSDC...");
  const AstUSDC = await ethers.getContractFactory("AstUSDC");
  const astUsdc = await AstUSDC.deploy();
  await astUsdc.waitForDeployment();
  const astUsdcAddr = await astUsdc.getAddress();
  console.log("AstUSDC deployed to:", astUsdcAddr);

  // 2. Deploy ArcVault
  console.log("\nDeploying ArcVault...");
  const ArcVault = await ethers.getContractFactory("ArcVault");
  const vault = await ArcVault.deploy(astUsdcAddr);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log("ArcVault deployed to:", vaultAddr);

  // 3. Link: set ArcVault as the minter of AstUSDC
  console.log("\nLinking AstUSDC -> ArcVault...");
  const tx = await astUsdc.setVault(vaultAddr);
  await tx.wait();
  console.log("Vault linked as minter.");

  console.log("\n========================================");
  console.log("VAULT DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log("AstUSDC address:", astUsdcAddr);
  console.log("ArcVault address:", vaultAddr);
  console.log("========================================");
}

main().catch(console.error);
