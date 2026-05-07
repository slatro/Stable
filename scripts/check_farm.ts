import { ethers } from "hardhat";

async function main() {
  const FARM_ADDR = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
  const code = await ethers.provider.getCode(FARM_ADDR);
  console.log("CODE_LENGTH: " + code.length);
  if (code.length > 2) {
    console.log("CONTRACT EXISTS AT THIS ADDRESS");
  } else {
    console.log("NO CONTRACT FOUND!");
  }
}

main().catch(console.error);
