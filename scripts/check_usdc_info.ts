import { ethers } from "hardhat";

async function main() {
  const usdcAddr = "0x3600000000000000000000000000000000000000";
  const user = "0x6f92312d1efcE68C07c1ac8c31268C81E0F67D34"; // My deployer address
  const usdc = await ethers.getContractAt([
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)"
  ], usdcAddr);

  const bal = await usdc.balanceOf(user);
  const dec = await usdc.decimals();
  console.log(`Balance: ${bal.toString()}, Decimals: ${dec}`);
}

main().catch(console.error);
