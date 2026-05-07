import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AMM Infrastructure with:", deployer.address);

  // 1. Deploy Factory
  const Factory = await ethers.getContractFactory("ArcFXFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("ArcFXFactory deployed to:", factoryAddress);

  // 2. Deploy Router
  const Router = await ethers.getContractFactory("ArcFXRouter");
  const router = await Router.deploy(factoryAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("ArcFXRouter deployed to:", routerAddress);

  console.log("\n--- AMM DEPLOYMENT SUMMARY ---");
  console.log("Factory:", factoryAddress);
  console.log("Router:", routerAddress);
  console.log("------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
