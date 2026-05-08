import { ethers } from "hardhat";

async function main() {
  const factoryAddr = "0x9D2DEF35AEF904dD9f27fd71D48488E0756EC1Aa";
  const aUSDC = "0xeD7cb772b49448027901546870425579596faaE1";
  const aEURC = "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9";

  const factory = await ethers.getContractAt([
    "function getPool(address, address) external view returns (address)"
  ], factoryAddr);

  const pool = await factory.getPool(aUSDC, aEURC);
  console.log("POOL_FOR_USDC_EURC:", pool);
}

main().catch(console.error);
