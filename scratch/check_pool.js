
const { ethers } = require("hardhat");

async function main() {
  const factoryAddr = "0xc9a98d433fE7879A6C29576D8ba29776B88151EE";
  const aUSDC = "0xeD7cb772b49448027901546870425579596faaE1";
  const aEURC = "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9";

  const factory = await ethers.getContractAt([
    "function getPool(address,address) view returns (address)"
  ], factoryAddr);

  const pool = await factory.getPool(aUSDC, aEURC);
  console.log("POOL_ADDRESS:", pool);

  if (pool !== "0x0000000000000000000000000000000000000000") {
    const amm = await ethers.getContractAt([
      "function reserve0() view returns (uint256)",
      "function reserve1() view returns (uint256)",
      "function totalLiquidity() view returns (uint256)",
      "function liquidityShares(address) view returns (uint256)"
    ], pool);

    const r0 = await amm.reserve0();
    const r1 = await amm.reserve1();
    const total = await amm.totalLiquidity();
    console.log("RESERVES:", r0.toString(), r1.toString());
    console.log("TOTAL_LP:", total.toString());
    
    const user = "0x6f92312d1efcE68C07c1ac8c31268C81E0F67D34"; // Check deployer first
    const bal = await amm.liquidityShares(user);
    console.log("DEPLOYER_LP_BALANCE:", bal.toString());
  }
}

main().catch(console.error);
