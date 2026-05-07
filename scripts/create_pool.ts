import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Creating pool with:", deployer.address);

  const factoryAddr = "0x1e060a16f60e369b6DabBa9Ee60c71402F5a0128";
  const aUSDCAddr = "0xeD7cb772b49448027901546870425579596faaE1";
  const aEURCAddr = "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9";

  const factory = await ethers.getContractAt("ArcFXFactory", factoryAddr);

  console.log("Checking if pool exists...");
  const existingPool = await factory.getPool(aUSDCAddr, aEURCAddr);
  if (existingPool !== "0x0000000000000000000000000000000000000000") {
    console.log("Pool already exists at:", existingPool);
    return;
  }

  console.log("Creating new pool via Factory...");
  const tx = await factory.createPool(aUSDCAddr, aEURCAddr);
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  console.log("Pool created successfully!");

  const newPool = await factory.getPool(aUSDCAddr, aEURCAddr);
  console.log("New Pool Address:", newPool);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
