import { ethers } from "hardhat";

async function main() {
  const ROUTER_ADDR = "0x94Fb0a829e87f83CD82b1be797431a4552558de6";
  const FAUCET_ADDR = "0x8937555415F5e3D08a0a6d00f5CFBb076a5929A0";
  
  const router = await ethers.getContractAt("ArcFXRouter", ROUTER_ADDR);
  const factoryAddr = await router.factory();
  console.log("FACTORY: " + factoryAddr);
  
  const faucet = await ethers.getContractAt("MultiFaucet", FAUCET_ADDR);
  try {
    const tokens = await faucet.getAllTokens();
    console.log("FAUCET_TOKENS:");
    for(let t of tokens) {
      const erc = await ethers.getContractAt("ERC20", t);
      const sym = await erc.symbol();
      console.log(`${sym}: ${t}`);
    }
  } catch (e) {
    console.log("Could not get faucet tokens");
  }
}

main().catch(console.error);
