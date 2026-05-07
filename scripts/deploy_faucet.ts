import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MultiFaucet with:", deployer.address);

  const Faucet = await ethers.getContractFactory("ArcMultiFaucet");
  const faucet = await Faucet.deploy(deployer.address);
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();
  console.log("MultiFaucet deployed to:", faucetAddr);

  const tokens = [
    { symbol: "aUSDC", addr: "0xeD7cb772b49448027901546870425579596faaE1", amount: "100", decimals: 6 },
    { symbol: "aEURC", addr: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9", amount: "100", decimals: 18 },
    { symbol: "aGBPC", addr: "0x6374151C499DADc9A54650D25CdFF3B5688652Ba", amount: "100", decimals: 18 },
    { symbol: "aTRYC", addr: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee", amount: "5000", decimals: 18 },
    { symbol: "aJPYC", addr: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09", amount: "15000", decimals: 18 }
  ];

  const tokenAddrs = tokens.map(t => t.addr);
  const claimAmounts = tokens.map(t => parseUnits(t.amount, t.decimals));

  console.log("Configuring Faucet tokens and amounts...");
  await (await faucet.setTokensAndAmounts(tokenAddrs, claimAmounts)).wait();

  console.log("Funding Faucet with 10M of each token...");
  for (const t of tokens) {
    const contract = await ethers.getContractAt("ArcToken", t.addr);
    const fundAmount = parseUnits("10000000", t.decimals);
    await (await contract.transfer(faucetAddr, fundAmount)).wait();
    console.log(`Funded ${t.symbol}`);
  }

  console.log("MultiFaucet configuration COMPLETED!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
