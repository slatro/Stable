import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("MINTING tokens for:", deployer.address);

  const tokens = [
    { symbol: 'aUSDC', addr: "0xeD7cb772b49448027901546870425579596faaE1", decimals: 6 },
    { symbol: 'aEURC', addr: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9", decimals: 18 },
    { symbol: 'aTRYC', addr: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee", decimals: 18 },
    { symbol: 'aGBPC', addr: "0x6374151C499DADc9A54650D25CdFF3B5688652Ba", decimals: 18 },
    { symbol: 'aJPYC', addr: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09", decimals: 18 }
  ];

  for (const token of tokens) {
    console.log(`Minting 1 Billion ${token.symbol}...`);
    const contract = await ethers.getContractAt("ArcToken", token.addr);
    const tx = await contract.mint(deployer.address, parseUnits("1000000000", token.decimals));
    await tx.wait();
    console.log(`${token.symbol} MINTED!`);
  }

  console.log("\nALL TOKENS MINTED SUCCESSFULLY! 💰🚀");
}

main().catch(console.error);
