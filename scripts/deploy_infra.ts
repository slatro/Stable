import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("DEPLOYING CLEAN INFRASTRUCTURE with:", deployer.address);

  // 1. Deploy Factory
  const Factory = await ethers.getContractFactory("ArcFXFactory");
  const factory = await Factory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("NEW_FACTORY_ADDR:", factoryAddr);

  // 2. Deploy Router
  const Router = await ethers.getContractFactory("ArcFXRouter");
  const router = await Router.deploy(factoryAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("NEW_ROUTER_ADDR:", routerAddr);

  // 3. Update Frontend Config
  const configPath = path.join(__dirname, "../frontend/src/config/contracts.ts");
  let content = fs.readFileSync(configPath, "utf8");
  
  // Replace FACTORY and ROUTER addresses
  content = content.replace(/FACTORY: "[^"]+"/, `FACTORY: "${factoryAddr}"`);
  content = content.replace(/ROUTER: "[^"]+"/, `ROUTER: "${routerAddr}"`);
  
  fs.writeFileSync(configPath, content);
  console.log("FRONTEND_CONFIG_UPDATED! 🚀");

  console.log("\n--- READY FOR MEGA SEEDING ---");
}

main().catch(console.error);
