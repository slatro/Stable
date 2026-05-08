import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const tokens = [
    { symbol: "aUSDC", addr: "0xeD7cb772b49448027901546870425579596faaE1" },
    { symbol: "aEURC", addr: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9" }
  ];

  console.log("CHECKING BALANCES FOR:", deployer.address);
  for (const t of tokens) {
    const contract = await ethers.getContractAt([
      "function balanceOf(address) external view returns (uint256)",
      "function decimals() external view returns (uint8)"
    ], t.addr);
    const bal = await contract.balanceOf(deployer.address);
    const dec = await contract.decimals();
    console.log(`${t.symbol} Balance:`, ethers.formatUnits(bal, dec));
  }
}

main().catch(console.error);
