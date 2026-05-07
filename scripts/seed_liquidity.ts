import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding initial liquidity with:", deployer.address);

  // Addresses from deployment
  const factoryAddr = "0x1e060a16f60e369b6DabBa9Ee60c71402F5a0128";
  const routerAddr = "0x291C98844bEE04700aB42ab932030Cff069947DC";
  const aUSDCAddr = "0xeD7cb772b49448027901546870425579596faaE1";
  const aEURCAddr = "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9";

  const aUSDC = await ethers.getContractAt("ArcToken", aUSDCAddr);
  const aEURC = await ethers.getContractAt("ArcToken", aEURCAddr);
  const router = await ethers.getContractAt("ArcFXRouter", routerAddr);

  const amountUSDC = parseUnits("1000000", 6);   // 1 Million aUSDC
  const amountEURC = parseUnits("920000", 18);   // ~0.92 EUR per USD

  console.log("Approving tokens for Router...");
  await (await aUSDC.approve(routerAddr, amountUSDC)).wait();
  await (await aEURC.approve(routerAddr, amountEURC)).wait();
  console.log("Approvals done.");

  console.log("Adding liquidity to aUSDC/aEURC pool...");
  const tx = await router.addLiquidity(
    aUSDCAddr,
    aEURCAddr,
    amountUSDC,
    amountEURC,
    deployer.address
  );
  await tx.wait();
  console.log("Liquidity added successfully!");

  const factory = await ethers.getContractAt("ArcFXFactory", factoryAddr);
  const poolAddr = await factory.getPool(aUSDCAddr, aEURCAddr);
  console.log("aUSDC/aEURC Pool Address:", poolAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
