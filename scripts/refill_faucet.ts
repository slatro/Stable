import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  const NEW_FAUCET = "0x256B553b2Db34a0B10536cB4628610aFF4E1e7f6";
  
  console.log(`Refilling NEW Faucet (${NEW_FAUCET}) with MASSIVE amounts...`);

  const shipments = [
    { symbol: "aTRYC", addr: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee", amount: "500000000", decimals: 18 },
    { symbol: "aJPYC", addr: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09", amount: "1500000000", decimals: 18 }
  ];

  for (const s of shipments) {
    const contract = await ethers.getContractAt("ArcToken", s.addr);
    const amount = parseUnits(s.amount, s.decimals); 
    console.log(`Transferring ${s.amount} ${s.symbol} to NEW Faucet...`);
    await (await contract.transfer(NEW_FAUCET, amount)).wait();
    console.log(`SUCCESS: ${s.symbol} refilled!`);
  }

  console.log("\nNEW FAUCET IS NOW A GLOBAL RESERVE! 🌍💰🚀");
}

main().catch(console.error);
