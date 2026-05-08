import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const ROUTER_ABI = ["function factory() view returns (address)"];
  const routerAddr = "0x214aa16f3571C2dC19Cdf4bCEf70733Dcd6cA7DF";
  const router = new ethers.Contract(routerAddr, ROUTER_ABI, deployer);
  const factory = await router.factory();
  console.log("Router Factory Address:", factory);
}

main().catch(console.error);
