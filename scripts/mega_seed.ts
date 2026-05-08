import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("MEGA SEEDING starting with:", deployer.address);

  const routerAddr = "0x0D87591ac68609547010C209d58B6d06703d473b";
  const aUSDCAddr = "0xeD7cb772b49448027901546870425579596faaE1";
  
  // Increase seeding to 10M for deep liquidity (0.1% impact for 10k trades)
  const aUSDCAmount = parseUnits("10000000", 6); 
  
  const tokens = [
    { symbol: 'aEURC', addr: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9", amount: parseUnits("8525000", 18) }, // 1.173 price -> ~8.5M
    { symbol: 'aTRYC', addr: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee", amount: parseUnits("325200000", 18) }, // 32.52 price -> ~325M
    { symbol: 'aGBPC', addr: "0x6374151C499DADc9A54650D25CdFF3B5688652Ba", amount: parseUnits("7390000", 18) }, // 1.353 price -> ~7.4M
    { symbol: 'aJPYC', addr: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09", amount: parseUnits("1570000000", 18) } // 0.00637 price -> ~1.57B
  ];

  const aUSDC = await ethers.getContractAt("ArcToken", aUSDCAddr);
  const router = await ethers.getContractAt("ArcFXRouter", routerAddr);

  for (const token of tokens) {
    console.log(`\n--- Seeding ${token.symbol} Pool ---`);
    const otherToken = await ethers.getContractAt("ArcToken", token.addr);

    console.log(`Approving tokens for ${token.symbol} pool...`);
    await (await aUSDC.approve(routerAddr, aUSDCAmount)).wait();
    await (await otherToken.approve(routerAddr, token.amount)).wait();

    console.log(`Adding liquidity to aUSDC/${token.symbol}...`);
    const tx = await router.addLiquidity(
      aUSDCAddr,
      token.addr,
      aUSDCAmount,
      token.amount,
      deployer.address,
      { gasLimit: 5000000 }
    );
    await tx.wait();
    console.log(`${token.symbol} Pool SEEDED!`);
  }

  console.log("\nMEGA SEEDING COMPLETED SUCCESSFULLY! 🚀");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
