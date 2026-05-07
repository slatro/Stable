import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying tokens with the account:", deployer.address);

  const ArcToken = await ethers.getContractFactory("ArcToken");

  const tokens = [
    { name: "Arc Dollar", symbol: "aUSDC", decimals: 6, supply: 100000000 }, // 100 Million
    { name: "Arc Euro", symbol: "aEURC", decimals: 18, supply: 100000000 },  // 100 Million
    { name: "Arc Lira", symbol: "aTRYC", decimals: 18, supply: 5000000000 }, // 5 Billion
    { name: "Arc Pound", symbol: "aGBPC", decimals: 18, supply: 100000000 }, // 100 Million
    { name: "Arc Yen", symbol: "aJPYC", decimals: 18, supply: 15000000000 }, // 15 Billion
  ];

  const deployedAddresses: any = {};

  for (const token of tokens) {
    console.log(`Deploying ${token.name} (${token.symbol})...`);
    const contract = await ArcToken.deploy(
      token.name,
      token.symbol,
      token.decimals,
      token.supply
    );
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`${token.symbol} deployed to:`, address);
    deployedAddresses[token.symbol] = address;
  }

  console.log("\n--- DEPLOYMENT SUMMARY ---");
  console.table(deployedAddresses);
  console.log("--------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
