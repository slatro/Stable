import { ethers } from "hardhat";

async function main() {
  const user = "0x6f92312d1efcE68C07c1ac8c31268C81E0F67D34";
  console.log("Checking tokens for:", user);

  // Check some likely addresses or scan logs
  const possible = [
    "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    "0x3600000000000000000000000000000000000000",
    "0x8e97ed5ceBBCC15c98A0C525f27DbB9BBA3Bea2F",
    "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9",
    "0x8937555415F5e3D08a0a6d00f5CFBb076a5929A0", // Faucet?
  ];

  for (const addr of possible) {
    try {
      const erc = await ethers.getContractAt([
        "function balanceOf(address) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
      ], addr);
      const sym = await erc.symbol();
      const bal = await erc.balanceOf(user);
      const dec = await erc.decimals();
      console.log(`${sym} (${addr}): ${ethers.formatUnits(bal, dec)} (Decimals: ${dec})`);
    } catch (e) {
      // console.log(`Not a token: ${addr}`);
    }
  }
}

main().catch(console.error);
