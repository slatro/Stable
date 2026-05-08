import { ethers } from "hardhat";

async function main() {
  const FAUCET_ADDR = "0x8937555415F5e3D08a0a6d00f5CFBb076a5929A0";
  const faucet = await ethers.getContractAt("ArcMultiFaucet", FAUCET_ADDR);

  console.log("Checking tokens registered in Faucet...");
  
  // Try to get tokens one by one (since there's no getAllTokens)
  for (let i = 0; i < 10; i++) {
    try {
      const tokenAddr = await faucet.tokens(i);
      const token = await ethers.getContractAt("ArcToken", tokenAddr);
      const symbol = await token.symbol();
      const balance = await token.balanceOf(FAUCET_ADDR);
      console.log(`Token [${i}]: ${symbol} at ${tokenAddr} - Balance: ${ethers.formatUnits(balance, await token.decimals())}`);
    } catch (e) {
      console.log(`End of token list at index ${i}`);
      break;
    }
  }
}

main().catch(console.error);
