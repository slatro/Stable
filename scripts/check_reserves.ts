import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const FACTORY_ABI = ["function allPools(uint256) view returns (address)", "function allPoolsLength() view returns (uint256)"];
  
  const factoryAddr = "0x9D2DEF35AEF904dD9f27fd71D48488E0756EC1Aa";
  const factory = new ethers.Contract(factoryAddr, FACTORY_ABI, deployer);

  const length = await factory.allPoolsLength();
  for (let i = 0; i < Number(length); i++) {
    const poolAddr = await factory.allPools(i);
    // Use raw call to get reserves
    try {
      const res0 = await deployer.call({ to: poolAddr, data: "0x0902f1ac" }); // reserve0()
      const res1 = await deployer.call({ to: poolAddr, data: "0xba197351" }); // reserve1()
      console.log(`Pool ${i} (${poolAddr}):`);
      console.log(`  Res0 Raw: ${res0}`);
      console.log(`  Res1 Raw: ${res1}`);
    } catch (e) {
      console.log(`  Pool ${i} failed.`);
    }
  }
}

main().catch(console.error);
