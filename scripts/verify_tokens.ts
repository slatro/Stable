import { ethers } from "hardhat";

async function main() {
  const tokens = [
    { symbol: "aUSDC", addr: "0xeD7cb772b49448027901546870425579596faaE1" },
    { symbol: "aEURC", addr: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9" },
    { symbol: "aTRYC", addr: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee" }
  ];

  for (const t of tokens) {
    try {
      const code = await ethers.provider.getCode(t.addr);
      console.log(`${t.symbol} (${t.addr}) Code length:`, code.length);
      
      const contract = await ethers.getContractAt([
        "function decimals() external view returns (uint8)"
      ], t.addr);
      const dec = await contract.decimals();
      console.log(`${t.symbol} Decimals:`, dec);
    } catch (e) {
      console.log(`${t.symbol} FAILED:`, e.message);
    }
  }
}

main().catch(console.error);
