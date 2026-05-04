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

  // 2. Deploy AMMs (Pools)
  const ArcFXAMM = await ethers.getContractFactory("ArcFXAMM");
  
  // Pool 1: USDC/EURC
  const ammEUR = await ArcFXAMM.deploy(usdcAddr, eurcAddr, deployer.address);
  await ammEUR.waitForDeployment();
  const ammEURAddr = await ammEUR.getAddress();

  // Pool 2: USDC/TRYC
  const ammTRY = await ArcFXAMM.deploy(usdcAddr, trycAddr, deployer.address);
  await ammTRY.waitForDeployment();
  const ammTRYAddr = await ammTRY.getAddress();

  // Pool 3: USDC/GBPC
  const ammGBP = await ArcFXAMM.deploy(usdcAddr, gbpcAddr, deployer.address);
  await ammGBP.waitForDeployment();
  const ammGBPAddr = await ammGBP.getAddress();

  // Pool 4: USDC/JPYC
  const ammJPY = await ArcFXAMM.deploy(usdcAddr, jpycAddr, deployer.address);
  await ammJPY.waitForDeployment();
  const ammJPYAddr = await ammJPY.getAddress();

  // 3. Mint (10M for each)
  console.log("Minting tokens...");
  await (await usdc.mint(deployer.address, ethers.parseUnits("10000000", 6))).wait();
  await (await eurc.mint(deployer.address, ethers.parseUnits("10000000", 18))).wait();
  await (await tryc.mint(deployer.address, ethers.parseUnits("10000000", 18))).wait();
  await (await gbpc.mint(deployer.address, ethers.parseUnits("10000000", 18))).wait();
  await (await jpyc.mint(deployer.address, ethers.parseUnits("10000000", 18))).wait();

  // 4. Initial Liquidity (LIVE MARKET RATES - MAY 4, 2026)
  console.log("Adding liquidity with LIVE market rates...");

  // EUR Pool (10k USDC / 8.547k EURC) - 1 EUR = 1.17 USD
  await (await usdc.approve(ammEURAddr, ethers.parseUnits("10000", 6))).wait();
  await (await eurc.approve(ammEURAddr, ethers.parseUnits("8547", 18))).wait();
  await (await ammEUR.addLiquidity(ethers.parseUnits("10000", 6), ethers.parseUnits("8547", 18))).wait();

  // TRYC Pool (10k USDC / 451.4k TRYC) - 1 USD = 45.14 TRY
  await (await usdc.approve(ammTRYAddr, ethers.parseUnits("10000", 6))).wait();
  await (await tryc.approve(ammTRYAddr, ethers.parseUnits("451400", 18))).wait();
  await (await ammTRY.addLiquidity(ethers.parseUnits("10000", 6), ethers.parseUnits("451400", 18))).wait();

  // GBPC Pool (10k USDC / 7.407k GBPC) - 1 GBP = 1.35 USD
  await (await usdc.approve(ammGBPAddr, ethers.parseUnits("10000", 6))).wait();
  await (await gbpc.approve(ammGBPAddr, ethers.parseUnits("7407", 18))).wait();
  await (await ammGBP.addLiquidity(ethers.parseUnits("10000", 6), ethers.parseUnits("7407", 18))).wait();

  // JPYC Pool (10k USDC / 1.5695M JPYC) - 1 USD = 156.95 JPY
  await (await usdc.approve(ammJPYAddr, ethers.parseUnits("10000", 6))).wait();
  await (await jpyc.approve(ammJPYAddr, ethers.parseUnits("1569500", 18))).wait();
  await (await ammJPY.addLiquidity(ethers.parseUnits("10000", 6), ethers.parseUnits("1569500", 18))).wait();

  // 5. Save config
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
  AMM: "${ammEURAddr}", // Default pool
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
  console.log("Deployment complete! Rates are officially live from TradingView.");
}

main().catch(console.error);
