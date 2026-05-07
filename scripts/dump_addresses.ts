import { ethers } from "hardhat";

async function main() {
  const ROUTER_ADDR = "0x94Fb0a829e87f83CD82b1be797431a4552558de6";
  try {
    const router = await ethers.getContractAt("ArcFXRouter", ROUTER_ADDR);
    const factoryAddr = await router.factory();
    console.log("FACTORY_ADDR:", factoryAddr);

    const factory = await ethers.getContractAt("ArcFXFactory", factoryAddr);
    const poolsCount = await factory.allPoolsLength();
    console.log("TOTAL_POOLS:", poolsCount.toString());

    for (let i = 0; i < poolsCount; i++) {
      const poolAddr = await factory.allPools(i);
      const pool = await ethers.getContractAt("ArcFXAMM", poolAddr);
      const t0 = await pool.token0();
      const t1 = await pool.token1();
      console.log(`POOL_${i}:`, poolAddr, "TOKENS:", t0, t1);
    }
  } catch (e) {
    console.error("FAILED to fetch addresses:", e);
  }
}

main().catch(console.error);
