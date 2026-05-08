import { ethers } from "hardhat";

async function main() {
  const routerAddr = "0x1d71F5D5466a066aC58AC2B869bE567c37718aa1";
  const factoryInConfig = "0x3Ab2F559156e14A8e286aCD6CA1e9C5D912c7321";
  
  const router = await ethers.getContractAt([
    "function factory() view returns (address)"
  ], routerAddr);

  try {
    const factory = await router.factory();
    console.log(`Router: ${routerAddr}`);
    console.log(`Factory from Router: ${factory}`);
    console.log(`Factory in Config: ${factoryInConfig}`);
  } catch (e) {
    console.error("Failed to fetch factory from router:", e.message);
  }
}

main().catch(console.error);
