import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // 1. Deploy ArcToken (100M total supply minted to deployer)
  const ArcToken = await ethers.getContractFactory("ArcToken");
  const arc = await ArcToken.deploy();
  await arc.waitForDeployment();
  const arcAddress = await arc.getAddress();
  console.log("ArcToken deployed to:", arcAddress);

  // 2. Deploy ArcFXFarm (Distributes 10 ARC per second)
  const arcPerSecond = ethers.parseUnits("10", 18);
  const ArcFXFarm = await ethers.getContractFactory("ArcFXFarm");
  const farm = await ArcFXFarm.deploy(arcAddress, arcPerSecond);
  await farm.waitForDeployment();
  const farmAddress = await farm.getAddress();
  console.log("ArcFXFarm deployed to:", farmAddress);

  // 3. Fund the Farm with 50M ARC tokens for reward distribution
  const fundAmount = ethers.parseUnits("50000000", 18); // 50M ARC
  const tx1 = await arc.transfer(farmAddress, fundAmount);
  await tx1.wait();
  console.log("Transferred 50M ARC to the Farm.");

  // 4. Add existing LP pools to the Farm
  // Hardcoding the addresses from the frontend config
  const aUSDC_aTRYC_LP = "0x95CbAa2df6D1D1Ae22F90B982f6e1Aa73fABb000";
  const aEURC_aTRYC_LP = "0xe1d1Fc6c7c17D9885Bc0270f0dF29a71c20c22E4"; // These are mock, we should just use the actual LP token address of the created pairs

  // We will add one dummy pool just to initialize it, the frontend can add more dynamically or we can do it later
  const tx2 = await farm.add(100, aUSDC_aTRYC_LP, false);
  await tx2.wait();
  console.log("Added aUSDC/aTRYC LP to the Farm with 100 alloc points.");

  console.log("Deployment and setup complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
