import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Tokens
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();

  const MockEURC = await ethers.getContractFactory("MockEURC");
  const eurc = await MockEURC.deploy();
  await eurc.waitForDeployment();
  const eurcAddr = await eurc.getAddress();

  const MockTRYC = await ethers.getContractFactory("MockTRYC");
  const tryc = await MockTRYC.deploy();
  await tryc.waitForDeployment();
  const trycAddr = await tryc.getAddress();

  const MockGBPC = await ethers.getContractFactory("MockGBPC");
  const gbpc = await MockGBPC.deploy();
  await gbpc.waitForDeployment();
  const gbpcAddr = await gbpc.getAddress();

  const MockJPYC = await ethers.getContractFactory("MockJPYC");
  const jpyc = await MockJPYC.deploy();
  await jpyc.waitForDeployment();
  const jpycAddr = await jpyc.getAddress();

  // 2. Deploy MultiFaucet
  const MultiFaucet = await ethers.getContractFactory("MultiFaucet");
  const faucet = await MultiFaucet.deploy(
    [usdcAddr, eurcAddr, trycAddr, gbpcAddr, jpycAddr],
    [6, 18, 18, 18, 18]
  );
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();

  // 3. Deploy AMMs (Pools)
  const ArcFXAMM = await ethers.getContractFactory("ArcFXAMM");
  
  const ammEUR = await ArcFXAMM.deploy(usdcAddr, eurcAddr, deployer.address);
  const ammTRY = await ArcFXAMM.deploy(usdcAddr, trycAddr, deployer.address);
  const ammGBP = await ArcFXAMM.deploy(usdcAddr, gbpcAddr, deployer.address);
  const ammJPY = await ArcFXAMM.deploy(usdcAddr, jpycAddr, deployer.address);
  
  await Promise.all([
    ammEUR.waitForDeployment(),
    ammTRY.waitForDeployment(),
    ammGBP.waitForDeployment(),
    ammJPY.waitForDeployment()
  ]);

  const ammEURAddr = await ammEUR.getAddress();
  const ammTRYAddr = await ammTRY.getAddress();
  const ammGBPAddr = await ammGBP.getAddress();
  const ammJPYAddr = await ammJPY.getAddress();

  // 4. Mint huge amounts for deep liquidity (1 Billion each)
  console.log("Minting huge amounts for deep liquidity...");
  await (await usdc.mint(deployer.address, ethers.parseUnits("1000000000", 6))).wait();
  await (await eurc.mint(deployer.address, ethers.parseUnits("1000000000", 18))).wait();
  await (await tryc.mint(deployer.address, ethers.parseUnits("1000000000", 18))).wait();
  await (await gbpc.mint(deployer.address, ethers.parseUnits("1000000000", 18))).wait();
  await (await jpyc.mint(deployer.address, ethers.parseUnits("1000000000", 18))).wait();

  // 5. Initial Liquidity (1 MILLION USD PER POOL)
  console.log("Adding 1 Million USD liquidity per pool for stable prices...");

  // EUR Pool (1M USDC / 854.7k EURC) - 1 EUR = 1.17 USD
  await (await usdc.approve(ammEURAddr, ethers.parseUnits("1000000", 6))).wait();
  await (await eurc.approve(ammEURAddr, ethers.parseUnits("854700", 18))).wait();
  await (await ammEUR.addLiquidity(ethers.parseUnits("1000000", 6), ethers.parseUnits("854700", 18))).wait();

  // TRYC Pool (1M USDC / 45.14M TRYC) - 1 USD = 45.14 TRY
  await (await usdc.approve(ammTRYAddr, ethers.parseUnits("1000000", 6))).wait();
  await (await tryc.approve(ammTRYAddr, ethers.parseUnits("45140000", 18))).wait();
  await (await ammTRY.addLiquidity(ethers.parseUnits("1000000", 6), ethers.parseUnits("45140000", 18))).wait();

  // GBPC Pool (1M USDC / 740.7k GBPC) - 1 GBP = 1.35 USD
  await (await usdc.approve(ammGBPAddr, ethers.parseUnits("1000000", 6))).wait();
  await (await gbpc.approve(ammGBPAddr, ethers.parseUnits("740700", 18))).wait();
  await (await ammGBP.addLiquidity(ethers.parseUnits("1000000", 6), ethers.parseUnits("740700", 18))).wait();

  // JPYC Pool (1M USDC / 156.95M JPYC) - 1 USD = 156.95 JPY
  await (await usdc.approve(ammJPYAddr, ethers.parseUnits("1000000", 6))).wait();
  await (await jpyc.approve(ammJPYAddr, ethers.parseUnits("156950000", 18))).wait();
  await (await ammJPY.addLiquidity(ethers.parseUnits("1000000", 6), ethers.parseUnits("156950000", 18))).wait();

  // 6. Save config
  const configContent = `
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  hexChainId: "0x4CEF72",
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  blockExplorerUrl: "https://testnet.arcscan.app",
};

export const CONTRACT_ADDRESSES = {
  mUSDC: "${usdcAddr}",
  mEURC: "${eurcAddr}",
  mTRYC: "${trycAddr}",
  mGBPC: "${gbpcAddr}",
  mJPYC: "${jpycAddr}",
  FAUCET: "${faucetAddr}",
  AMM: "${ammEURAddr}",
  POOLS: {
    "mEURC": "${ammEURAddr}",
    "mTRYC": "${ammTRYAddr}",
    "mGBPC": "${ammGBPAddr}",
    "mJPYC": "${ammJPYAddr}",
  }
} as const;
`;

  const configPath = path.join(__dirname, "../frontend/src/config/contracts.ts");
  fs.writeFileSync(configPath, configContent);
  console.log("Deployment complete! Liquidity is now deep.");
}

main().catch(console.error);
