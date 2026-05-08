import { ethers } from "hardhat";

async function main() {
  const pools = [
    "0x8e97ed5ceBBCC15c98A0C525f27DbB9BBA3Bea2F",
    "0x3E8D2097b4CeaCC316d115C527B79FD165E9a0B3",
    "0x07E7fC5802D61c75069cCb8F2fD39a9353048F06",
    "0xxfcfBD316Ceb0DAb169f7430F594360E064e55e33".replace('0xx', '0x')
  ];
  
  for (const poolAddr of pools) {
    const pool = await ethers.getContractAt([
      "function token0() view returns (address)",
      "function token1() view returns (address)"
    ], poolAddr);
    
    try {
      const t0 = await pool.token0();
      const t1 = await pool.token1();
      console.log(`Pool ${poolAddr}: t0=${t0}, t1=${t1}`);
    } catch (e) {
      console.error(`Error reading pool ${poolAddr}: ${e.message}`);
    }
  }
}

main().catch(console.error);
