import { ethers } from "hardhat";

async function main() {
  const poolAddr = "0x8e97ed5ceBBCC15c98A0C525f27DbB9BBA3Bea2F";
  const pool = await ethers.getContractAt([
    "function token0() view returns (address)",
    "function token1() view returns (address)"
  ], poolAddr);

  const t0 = await pool.token0();
  const t1 = await pool.token1();
  console.log("Token0:", t0);
  console.log("Token1:", t1);
}

main().catch(console.error);
