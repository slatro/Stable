import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC, MockEURC, ArcFXAMM } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ArcFXAMM - Professional Suite", function () {
  let usdc: MockUSDC;
  let eurc: MockEURC;
  let amm: ArcFXAMM;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let treasury: SignerWithAddress;

  // USDC has 6 decimals, EURC has 18
  const MINT_AMOUNT_USDC = ethers.parseUnits("1000000", 6);
  const MINT_AMOUNT_EURC = ethers.parseUnits("1000000", 18);
  
  const LIQUIDITY_USDC = ethers.parseUnits("1000", 6);    // 1,000 USDC
  const LIQUIDITY_EURC = ethers.parseUnits("1173", 18);   // 1,173 EURC (~1.173 rate)

  beforeEach(async function () {
    [owner, user, treasury] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const MockEURC = await ethers.getContractFactory("MockEURC");
    eurc = await MockEURC.deploy();

    const ArcFXAMM = await ethers.getContractFactory("ArcFXAMM");
    amm = await ArcFXAMM.deploy(await usdc.getAddress(), await eurc.getAddress(), treasury.address);

    // Minting
    await usdc.mint(owner.address, MINT_AMOUNT_USDC);
    await eurc.mint(owner.address, MINT_AMOUNT_EURC);
    await usdc.mint(user.address, MINT_AMOUNT_USDC);
    await eurc.mint(user.address, MINT_AMOUNT_EURC);

    // Approvals
    await usdc.approve(await amm.getAddress(), MINT_AMOUNT_USDC);
    await eurc.approve(await amm.getAddress(), MINT_AMOUNT_EURC);
    await usdc.connect(user).approve(await amm.getAddress(), MINT_AMOUNT_USDC);
    await eurc.connect(user).approve(await amm.getAddress(), MINT_AMOUNT_EURC);
  });

  describe("1. Deployment & Metadata", function () {
    it("Should normalize decimals correctly in constructor", async function () {
      expect(await amm.decimalsA()).to.equal(6);
      expect(await amm.decimalsB()).to.equal(18);
    });

    it("Should set the correct treasury", async function () {
      expect(await amm.treasury()).to.equal(treasury.address);
    });
  });

  describe("2. Liquidity with Decimal Differences", function () {
    it("Should add liquidity and normalize internally", async function () {
      await amm.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_EURC);
      
      // Reserves should store native amounts
      const reserves = await amm.getReserves();
      expect(reserves._reserveA).to.equal(LIQUIDITY_USDC);
      expect(reserves._reserveB).to.equal(LIQUIDITY_EURC);
      
      // LP Shares should be calculated based on 18-decimal normalization
      // sqrt(1000e18 * 1173e18) = sqrt(1173000)e18 = ~1083e18
      const lpBalance = await amm.getUserLiquidity(owner.address);
      expect(lpBalance).to.be.gt(ethers.parseUnits("1000", 18));
    });
  });

  describe("3. Unified Swap & Protocol Fees", function () {
    beforeEach(async function () {
      await amm.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_EURC);
    });

    it("Should swap USDC (6 dec) for EURC (18 dec) and collect fee", async function () {
      const amountIn = ethers.parseUnits("100", 6); // 100 USDC
      const treasuryInitial = await usdc.balanceOf(treasury.address);
      
      const expectedOut = await amm.getAmountOut(amountIn, await usdc.getAddress());
      await amm.connect(user).swap(await usdc.getAddress(), amountIn, 0);
      
      const userFinalEurc = await eurc.balanceOf(user.address);
      expect(userFinalEurc).to.be.gt(MINT_AMOUNT_EURC); // Started with 1M, got more
      
      // Treasury should have 0.05% of 100 USDC = 0.05 USDC = 50,000 units (6 decimals)
      const treasuryFinal = await usdc.balanceOf(treasury.address);
      expect(treasuryFinal - treasuryInitial).to.equal(50000); 
    });

    it("Should swap EURC (18 dec) for USDC (6 dec)", async function () {
      const amountIn = ethers.parseUnits("100", 18); // 100 EURC
      const initialUsdc = await usdc.balanceOf(user.address);
      
      await amm.connect(user).swap(await eurc.getAddress(), amountIn, 0);
      
      const finalUsdc = await usdc.balanceOf(user.address);
      expect(finalUsdc).to.be.gt(initialUsdc);
    });
  });

  describe("4. Administrative Controls", function () {
    it("Should pause and unpause trading", async function () {
      await amm.pause();
      const amountIn = ethers.parseUnits("10", 6);
      
      await expect(
        amm.connect(user).swap(await usdc.getAddress(), amountIn, 0)
      ).to.be.revertedWithCustomError(amm, "EnforcedPause");

      await amm.unpause();
      await amm.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_EURC);
      await expect(
        amm.connect(user).swap(await usdc.getAddress(), amountIn, 0)
      ).to.not.be.reverted;
    });

    it("Should only allow owner to pause", async function () {
      await expect(
        amm.connect(user).pause()
      ).to.be.revertedWithCustomError(amm, "OwnableUnauthorizedAccount");
    });
  });
});

