import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // 2. Deploy MockEURC
  const MockEURC = await ethers.getContractFactory("MockEURC");
  const eurc = await MockEURC.deploy();
  await eurc.waitForDeployment();
  const eurcAddress = await eurc.getAddress();
  console.log("MockEURC deployed to:", eurcAddress);

  // 3. Deploy ArcFXAMM
  const ArcFXAMM = await ethers.getContractFactory("ArcFXAMM");
  // Pass treasury address as the 3rd argument (using deployer for now)
  const amm = await ArcFXAMM.deploy(usdcAddress, eurcAddress, deployer.address);
  await amm.waitForDeployment();
  const ammAddress = await amm.getAddress();
  console.log("ArcFXAMM deployed to:", ammAddress);

  // 4. Mint initial tokens to deployer
  const mintAmountUSDC = ethers.parseUnits("1000000", 6);
  const mintAmountEURC = ethers.parseUnits("1000000", 18);
  console.log("Minting tokens...");
  await usdc.mint(deployer.address, mintAmountUSDC);
  await eurc.mint(deployer.address, mintAmountEURC);

  // 5. Approve AMM
  console.log("Approving AMM...");
  const liqUSDC = ethers.parseUnits("10000", 6);
  const liqEURC = ethers.parseUnits("11730", 18); // ~1.173 rate
  await usdc.approve(ammAddress, liqUSDC);
  await eurc.approve(ammAddress, liqEURC);

  // 6. Add initial liquidity
  console.log("Adding initial liquidity...");
  await amm.addLiquidity(liqUSDC, liqEURC);
  console.log("Initial liquidity added!");

  // 7. Save config for frontend
  const configDir = path.join(__dirname, "../frontend/src/config");
  const abisDir = path.join(__dirname, "../frontend/src/abis");

  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  if (!fs.existsSync(abisDir)) fs.mkdirSync(abisDir, { recursive: true });

  const ERC20_ABI = require("../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json").abi;
  const AMM_ABI = require("../artifacts/contracts/ArcFXAMM.sol/ArcFXAMM.json").abi;

  const configContent = `
export const ARC_TESTNET_CONFIG = {
  chainId: 5042002,
  hexChainId: "0x4CEF72",
  chainName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  blockExplorerUrl: "https://testnet.arcscan.app",
};

export const CONTRACT_ADDRESSES = {
  mUSDC: "${usdcAddress}",
  mEURC: "${eurcAddress}",
  AMM: "${ammAddress}",
} as const;
`;

  fs.writeFileSync(path.join(configDir, "contracts.ts"), configContent);
  fs.writeFileSync(path.join(abisDir, "ArcFXAMM.json"), JSON.stringify(AMM_ABI, null, 2));
  fs.writeFileSync(path.join(abisDir, "ERC20.json"), JSON.stringify(ERC20_ABI, null, 2));

  console.log("Deployment complete and files saved.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
