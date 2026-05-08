import { ethers } from "hardhat";

async function main() {
  const factoryAddr = "0x3Ab2F559156e14A8e286aCD6CA1e9C5D912c7321";
  const factory = await ethers.getContractAt([
    "function allPoolsLength() view returns (uint256)",
    "function allPools(uint256) view returns (address)"
  ], factoryAddr);

  const length = await factory.allPoolsLength();
  console.log(`Pools Length: ${length}`);
  
  for (let i = 0; i < length; i++) {
    const pool = await factory.allPools(i);
    console.log(`Pool ${i}: ${pool}`);
  }
}

main().catch(console.error);
