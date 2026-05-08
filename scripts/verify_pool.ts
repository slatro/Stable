import { ethers } from "hardhat";

async function main() {
  const poolAddr = "0x75f1B073Fc3f9Cf6cF170CE5312583a612D14Ea9";
  const pool = await ethers.getContractAt([
    "function token0() external view returns (address)",
    "function token1() external view returns (address)"
  ], poolAddr);

  try {
    const t0 = await pool.token0();
    const t1 = await pool.token1();
    console.log("POOL_TOKENS:", t0, t1);
  } catch (e) {
    console.log("NOT_AN_AMM_CONTRACT");
  }
}

main().catch(console.error);
