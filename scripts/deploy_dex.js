const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const treasury = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Local hardhat treasury or your target address

  // Deploy Factory
  const Factory = await hre.ethers.getContractFactory("ArcFXFactory");
  const factory = await Factory.deploy(treasury);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("ArcFXFactory deployed to:", factoryAddress);

  // Deploy Router
  const Router = await hre.ethers.getContractFactory("ArcFXRouter");
  const router = await Router.deploy(factoryAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("ArcFXRouter deployed to:", routerAddress);

  console.log("\nUpdate your frontend/src/config/contracts.ts with these addresses!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
