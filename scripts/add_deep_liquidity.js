const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const signer = signers[5]; // Use account #5 to avoid conflicting with user's wallet
  console.log("Adding liquidity with account:", signer.address);

  const faucetAddr = "0xe3A46EF1cB846eC0f7BBcC62F8c8a07Aa95AE806";
  const routerAddr = "0x94Fb0a829e87f83CD82b1be797431a4552558de6";

  const aUSDC = "0xACD6A3Ac96DF60f780fa617D180c84298D84E074";
  const aTRYC = "0xc8bf5f8DA69e760B57A73617561D8D2BaaCd746c";
  const aJPYC = "0x8F8814aD5Eef85C6235dcc123A3786A3597573A5";

  // ABI for Faucet
  const FaucetABI = [
    "function getTokens(address[] calldata tokens, uint256[] calldata amounts, address to) external"
  ];
  // ABI for ERC20
  const ERC20ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  // ABI for Router
  const RouterABI = [
    "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
  ];

  const faucet = new ethers.Contract(faucetAddr, FaucetABI, signer);
  const router = new ethers.Contract(routerAddr, RouterABI, signer);

  const tokenAUSDC = new ethers.Contract(aUSDC, ERC20ABI, signer);
  const tokenATRYC = new ethers.Contract(aTRYC, ERC20ABI, signer);
  const tokenAJPYC = new ethers.Contract(aJPYC, ERC20ABI, signer);

  // Fast forward time to bypass Faucet cooldown
  console.log("Fast forwarding time to bypass faucet cooldown...");
  await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
  await ethers.provider.send("evm_mine");

  // Define amounts (500k USDC value each)
  const amountUSDC = ethers.utils.parseUnits("1000000", 6); // 1M USDC
  const amountTRYC = ethers.utils.parseUnits("25000000", 18); // 25M TRYC
  const amountJPYC = ethers.utils.parseUnits("100000000", 18); // 100M JPYC

  // Mint tokens via Faucet
  console.log("Minting tokens from faucet...");
  const tx1 = await faucet.getTokens([aUSDC, aTRYC, aJPYC], [amountUSDC, amountTRYC, amountJPYC], signer.address);
  await tx1.wait();
  console.log("Tokens minted successfully.");

  // Approve Router
  console.log("Approving router...");
  await (await tokenAUSDC.approve(routerAddr, ethers.constants.MaxUint256)).wait();
  await (await tokenATRYC.approve(routerAddr, ethers.constants.MaxUint256)).wait();
  await (await tokenAJPYC.approve(routerAddr, ethers.constants.MaxUint256)).wait();

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Add Liquidity aUSDC/aTRYC
  console.log("Adding liquidity to aUSDC/aTRYC...");
  const usdcForTryc = ethers.utils.parseUnits("500000", 6);
  await (await router.addLiquidity(aUSDC, aTRYC, usdcForTryc, amountTRYC, 0, 0, signer.address, deadline)).wait();
  
  // Add Liquidity aUSDC/aJPYC
  console.log("Adding liquidity to aUSDC/aJPYC...");
  const usdcForJpyc = ethers.utils.parseUnits("500000", 6);
  await (await router.addLiquidity(aUSDC, aJPYC, usdcForJpyc, amountJPYC, 0, 0, signer.address, deadline)).wait();

  console.log("Deep liquidity successfully injected! Pools are now fully stabilized.");
}

main().catch(console.error);
