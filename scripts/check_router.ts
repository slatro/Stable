import { ethers } from "hardhat";

async function main() {
  const routerAddr = "0x94Fb0a829e87f83CD82b1be797431a4552558de6";
  const router = await ethers.getContractAt([
    "function factory() external view returns (address)"
  ], routerAddr);

  try {
    const factory = await router.factory();
    console.log("ROUTER_FACTORY_ADDR:", factory);
  } catch (e) {
    console.log("FAILED_TO_GET_FACTORY");
  }
}

main().catch(console.error);
