import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ArcPoints with:", deployer.address);

  const Points = await ethers.getContractFactory("ArcPoints");
  const points = await Points.deploy(deployer.address);
  await points.waitForDeployment();
  const pointsAddr = await points.getAddress();
  console.log("ArcPoints deployed to:", pointsAddr);

  console.log("ArcPoints configuration COMPLETED!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
