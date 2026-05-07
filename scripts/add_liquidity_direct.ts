import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity DIRECTLY with:", deployer.address);

  // Addresses
  const poolAddr = "0xa5b03Deced685E438fA65491B84586Af758631F1";
  const aUSDCAddr = "0xeD7cb772b49448027901546870425579596faaE1";
  const aEURCAddr = "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9";

  const aUSDC = await ethers.getContractAt("ArcToken", aUSDCAddr);
  const aEURC = await ethers.getContractAt("ArcToken", aEURCAddr);
  const pool = await ethers.getContractAt("ArcFXAMM", poolAddr);

  const amountUSDC = parseUnits("1000000", 6);   // 1 Million aUSDC
  const amountEURC = parseUnits("920000", 18);   // ~0.92 EUR per USD

  console.log("Approving tokens DIRECTLY for Pool...");
  await (await aUSDC.approve(poolAddr, amountUSDC)).wait();
  await (await aEURC.approve(poolAddr, amountEURC)).wait();
  console.log("Approvals done.");

  console.log("Adding liquidity directly to pool...");
  // AMM addLiquidity(uint256 amount0, uint256 amount1, address to)
  // Need to ensure amount0/amount1 order matches token0/token1
  const token0 = await pool.token0();
  const [amt0, amt1] = aUSDCAddr.toLowerCase() === token0.toLowerCase() 
    ? [amountUSDC, amountEURC] 
    : [amountEURC, amountUSDC];

  const tx = await pool.addLiquidity(amt0, amt1, deployer.address);
  await tx.wait();
  console.log("Liquidity added DIRECTLY successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
