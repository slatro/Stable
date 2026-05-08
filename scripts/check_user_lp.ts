import { ethers } from "hardhat";

async function main() {
  const user = "0x6f92312d1efcE68C07c1ac8c31268C81E0F67D34"; // emreoktem's address from previous logs
  const pools = [
    "0x8e97ed5ceBBCC15c98A0C525f27DbB9BBA3Bea2F", // EURC
    "0x3E8D2097b4CeaCC316d115C527B79FD165E9a0B3", // TRYC
    "0x07E7fC5802D61c75069cCb8F2fD39a9353048F06", // GBPC
    "0xfcfBD316Ceb0DAb169f7430F594360E064e55e33"  // JPYC
  ];
  
  for (const poolAddr of pools) {
    const pool = await ethers.getContractAt([
      "function liquidityShares(address) view returns (uint256)",
      "function token0() view returns (address)",
      "function token1() view returns (address)"
    ], poolAddr);
    
    try {
      const shares = await pool.liquidityShares(user);
      console.log(`Pool ${poolAddr}: Shares=${shares.toString()}`);
    } catch (e) {
      console.error(`Error reading pool ${poolAddr}: ${e.message}`);
    }
  }
}

main().catch(console.error);
