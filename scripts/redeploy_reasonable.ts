import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Starting 'Absolute Market Reality' Liquidity Operation with account:", deployer.address);

  const aUSDC_ADDR = "0xeD7cb772b49448027901546870425579596faaE1";
  const aEURC_ADDR = "0x429a1D105558f4727453d2a17dF17ac9d5be1EA9";
  const aTRYC_ADDR = "0x8DD16a98A3f5d767d5D08bEECbEa1Cd8CF2832ee";
  const aGBPC_ADDR = "0x6374151C499DADc9A54650D25CdFF3B5688652Ba";
  const aJPYC_ADDR = "0x7b765B44C9AF5EBb191296A05C8b9df5085f1f09";

  const ArcFXFactory = await ethers.getContractFactory("ArcFXFactory");
  const factory = await ArcFXFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("New Factory Deployed:", factoryAddr);

  const ArcFXRouter = await ethers.getContractFactory("ArcFXRouter");
  const router = await ArcFXRouter.deploy(factoryAddr);
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log("New Router Deployed:", routerAddr);

  const tokens = {
    usdc: await ethers.getContractAt("MockUSDC", aUSDC_ADDR),
    eurc: await ethers.getContractAt("MockEURC", aEURC_ADDR),
    tryc: await ethers.getContractAt("MockTRYC", aTRYC_ADDR),
    gbpc: await ethers.getContractAt("MockGBPC", aGBPC_ADDR),
    jpyc: await ethers.getContractAt("MockJPYC", aJPYC_ADDR),
  };

  const addLiq = async (tA: any, tB: any, amtA: string, amtB: string, dA: number, dB: number) => {
    const addrA = await tA.getAddress();
    const addrB = await tB.getAddress();
    const symA = await tA.symbol();
    const symB = await tB.symbol();
    
    console.log(`\nConfiguring Pool for ${symA} / ${symB}...`);
    await (await factory.createPool(addrA, addrB)).wait();
    const poolAddr = await factory.getPool(addrA, addrB);
    const pool = await ethers.getContractAt("ArcFXAMM", poolAddr);

    const isASortedFirst = addrA.toLowerCase() < addrB.toLowerCase();
    const [t0, t1] = isASortedFirst ? [tA, tB] : [tB, tA];
    const [amt0, amt1] = isASortedFirst ? [amtA, amtB] : [amtB, amtA];
    const [d0, d1] = isASortedFirst ? [dA, dB] : [dB, dA];

    await (await t0.mint(deployer.address, ethers.parseUnits(amt0, d0))).wait();
    await (await t1.mint(deployer.address, ethers.parseUnits(amt1, d1))).wait();
    await (await t0.approve(poolAddr, ethers.parseUnits(amt0, d0))).wait();
    await (await t1.approve(poolAddr, ethers.parseUnits(amt1, d1))).wait();

    console.log(`Adding Liquidity: ${amt0} and ${amt1}...`);
    await (await pool.addLiquidity(ethers.parseUnits(amt0, d0), ethers.parseUnits(amt1, d1), deployer.address)).wait();
    return poolAddr;
  };

  try {
    // ABSOLUTE MARKET REALITY (Matched to Chart/Oracle Data)
    // USD/TRY = 32.25
    await addLiq(tokens.usdc, tokens.tryc, "100000000", "3225000000", 6, 18);
    // USD/JPY = 153.40
    await addLiq(tokens.usdc, tokens.jpyc, "100000000", "15340000000", 6, 18);
    // USD/EUR = 0.92
    await addLiq(tokens.usdc, tokens.eurc, "100000000", "92000000", 6, 18);
    // USD/GBP = 0.79
    await addLiq(tokens.usdc, tokens.gbpc, "100000000", "79000000", 6, 18);
  } catch (e) {
    console.error("FAILED TO ADD LIQUIDITY:", e.message);
    process.exit(1);
  }

  const configContent = fs.readFileSync(path.join(__dirname, "../frontend/src/config/contracts.ts"), "utf8")
    .replace(/FACTORY: "[^"]+"/, `FACTORY: "${factoryAddr}"`)
    .replace(/ROUTER: "[^"]+"/, `ROUTER: "${routerAddr}"`);

  fs.writeFileSync(path.join(__dirname, "../frontend/src/config/contracts.ts"), configContent);

  console.log("\n--- ABSOLUTE MARKET REALITY OPERATION COMPLETE ---");
}

main().catch(console.error);
