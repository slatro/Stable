import { ethers } from "hardhat";
import { parseUnits } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("MEGA SEEDING starting with:", deployer.address);

  const routerAddr = "0xF54B19cfef19BD3ca63B1983cF67C047B908532c";
  const aUSDCAddr = "0xeD7cb772b49448027901546870425579596faaE1";
  
  const tokens = [
    { symbol: "aEURC", addr: "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9", rate: "0.92" },
    { symbol: "aTRYC", addr: "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee", rate: "32.50" },
    { symbol: "aGBPC", addr: "0x6374151C499DADc9A54650D25CdFF3B5688652Ba", rate: "0.78" },
    { symbol: "aJPYC", addr: "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09", rate: "155.00" }
  ];

  const aUSDC = await ethers.getContractAt("ArcToken", aUSDCAddr);
  const router = await ethers.getContractAt("ArcFXRouter", routerAddr);

  const amountUSDCPerPool = parseUnits("1000000", 6); // 1 Million USDC per pool

  for (const token of tokens) {
    console.log(`\n--- Seeding ${token.symbol} Pool ---`);
    const otherToken = await ethers.getContractAt("ArcToken", token.addr);
    const amountOther = parseUnits((1000000 * parseFloat(token.rate)).toFixed(0), 18);

    console.log(`Approving tokens for ${token.symbol} pool...`);
    await (await aUSDC.approve(routerAddr, amountUSDCPerPool)).wait();
    await (await otherToken.approve(routerAddr, amountOther)).wait();

    console.log(`Adding liquidity to aUSDC/${token.symbol}...`);
    const tx = await router.addLiquidity(
      aUSDCAddr,
      token.addr,
      amountUSDCPerPool,
      amountOther,
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
