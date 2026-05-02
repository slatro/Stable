import { expect } from "chai";
import { ethers } from "hardhat";
import { MockUSDC, MockEURC, ArcFXAMM } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ArcFXAMM", function () {
  let usdc: MockUSDC;
  let eurc: MockEURC;
  let amm: ArcFXAMM;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  const INITIAL_MINT = ethers.parseEther("1000000"); // 1M tokens
  const LIQUIDITY_USDC = ethers.parseEther("1000");
  const LIQUIDITY_EURC = ethers.parseEther("900"); // 1 USDC = 0.9 EURC roughly

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    const MockEURC = await ethers.getContractFactory("MockEURC");
    eurc = await MockEURC.deploy();

    const ArcFXAMM = await ethers.getContractFactory("ArcFXAMM");
    amm = await ArcFXAMM.deploy(await usdc.getAddress(), await eurc.getAddress());

    await usdc.mint(owner.address, INITIAL_MINT);
    await eurc.mint(owner.address, INITIAL_MINT);
    await usdc.mint(user.address, INITIAL_MINT);
    await eurc.mint(user.address, INITIAL_MINT);

    await usdc.approve(await amm.getAddress(), INITIAL_MINT);
    await eurc.approve(await amm.getAddress(), INITIAL_MINT);
    await usdc.connect(user).approve(await amm.getAddress(), INITIAL_MINT);
    await eurc.connect(user).approve(await amm.getAddress(), INITIAL_MINT);
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await amm.tokenA()).to.equal(await usdc.getAddress());
      expect(await amm.tokenB()).to.equal(await eurc.getAddress());
    });
  });

  describe("Liquidity", function () {
    it("Should add initial liquidity", async function () {
      await amm.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_EURC);
      
      const reserves = await amm.getReserves();
      expect(reserves._reserveA).to.equal(LIQUIDITY_USDC);
      expect(reserves._reserveB).to.equal(LIQUIDITY_EURC);
      
      const lpBalance = await amm.getUserLiquidity(owner.address);
      expect(lpBalance).to.be.gt(0);
    });

    it("Should remove liquidity", async function () {
      await amm.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_EURC);
      const lpBalance = await amm.getUserLiquidity(owner.address);
      
      await amm.removeLiquidity(lpBalance);
      
      const reserves = await amm.getReserves();
      expect(reserves._reserveA).to.equal(0);
      expect(reserves._reserveB).to.equal(0);
    });
  });

  describe("Swaps", function () {
    beforeEach(async function () {
      await amm.addLiquidity(LIQUIDITY_USDC, LIQUIDITY_EURC);
    });

    it("Should swap USDC for EURC", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedOut = await amm.quoteSwapAForB(amountIn);
      
      const initialEurc = await eurc.balanceOf(user.address);
      await amm.connect(user).swapAForB(amountIn, 0);
      const finalEurc = await eurc.balanceOf(user.address);
      
      expect(finalEurc - initialEurc).to.equal(expectedOut);
    });

    it("Should swap EURC for USDC", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedOut = await amm.quoteSwapBForA(amountIn);
      
      const initialUsdc = await usdc.balanceOf(user.address);
      await amm.connect(user).swapBForA(amountIn, 0);
      const finalUsdc = await usdc.balanceOf(user.address);
      
      expect(finalUsdc - initialUsdc).to.equal(expectedOut);
    });

    it("Should revert on high slippage", async function () {
      const amountIn = ethers.parseEther("100");
      const expectedOut = await amm.quoteSwapAForB(amountIn);
      
      await expect(
        amm.connect(user).swapAForB(amountIn, expectedOut + 1n)
      ).to.be.revertedWith("High slippage");
    });

    it("Should calculate 0.3% fee correctly", async function () {
      const amountIn = ethers.parseEther("100");
      // Manual calculation for x * y = k with fee
      // amountInWithFee = 100 * 0.997 = 99.7
      // reserveA = 1000, reserveB = 900
      // amountOut = (99.7 * 900) / (1000 + 99.7) = 89730 / 1099.7 = 81.595...
      
      const amountOut = await amm.quoteSwapAForB(amountIn);
      expect(amountOut).to.be.lt(ethers.parseEther("90")); // Without fee it would be ~81.8
      // 100 / 1000 * 900 = 90 (naive)
      // 100 * 900 / (1000 + 100) = 90000 / 1100 = 81.81 (no fee)
      // 99.7 * 900 / (1000 + 99.7) = 81.59 (with fee)
      expect(amountOut).to.be.closeTo(ethers.parseEther("81.595"), ethers.parseEther("0.001"));
    });
  });
});
