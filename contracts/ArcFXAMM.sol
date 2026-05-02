// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract ArcFXAMM is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable tokenA;
    address public immutable tokenB;

    uint256 public reserveA;
    uint256 public reserveB;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityProviderShares;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityBurned);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event ReservesUpdated(uint256 reserveA, uint256 reserveB);

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token addresses");
        require(_tokenA != _tokenB, "Tokens must be different");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    function addLiquidity(uint256 amountA, uint256 amountB) external nonReentrant returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Insufficient amounts");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        if (totalLiquidity == 0) {
            liquidity = Math.sqrt(amountA * amountB);
        } else {
            liquidity = Math.min(
                (amountA * totalLiquidity) / reserveA,
                (amountB * totalLiquidity) / reserveB
            );
        }

        require(liquidity > 0, "Liquidity minted is 0");

        reserveA += amountA;
        reserveB += amountB;
        totalLiquidity += liquidity;
        liquidityProviderShares[msg.sender] += liquidity;

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
        emit ReservesUpdated(reserveA, reserveB);
    }

    function removeLiquidity(uint256 lpAmount) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(lpAmount > 0, "Invalid LP amount");
        require(liquidityProviderShares[msg.sender] >= lpAmount, "Insufficient LP shares");

        amountA = (lpAmount * reserveA) / totalLiquidity;
        amountB = (lpAmount * reserveB) / totalLiquidity;

        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        liquidityProviderShares[msg.sender] -= lpAmount;
        totalLiquidity -= lpAmount;
        reserveA -= amountA;
        reserveB -= amountB;

        IERC20(tokenA).safeTransfer(msg.sender, amountA);
        IERC20(tokenB).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, lpAmount);
        emit ReservesUpdated(reserveA, reserveB);
    }

    function swapAForB(uint256 amountAIn, uint256 minAmountBOut) external nonReentrant returns (uint256 amountBOut) {
        require(amountAIn > 0, "Insufficient input amount");
        
        uint256 amountInWithFee = amountAIn * 997; // 0.3% fee
        amountBOut = (amountInWithFee * reserveB) / (reserveA * 1000 + amountInWithFee);
        
        require(amountBOut >= minAmountBOut, "High slippage");
        require(amountBOut < reserveB, "Insufficient pool liquidity");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountAIn);
        IERC20(tokenB).safeTransfer(msg.sender, amountBOut);

        reserveA += amountAIn;
        reserveB -= amountBOut;

        emit Swap(msg.sender, tokenA, tokenB, amountAIn, amountBOut);
        emit ReservesUpdated(reserveA, reserveB);
    }

    function swapBForA(uint256 amountBIn, uint256 minAmountAOut) external nonReentrant returns (uint256 amountAOut) {
        require(amountBIn > 0, "Insufficient input amount");
        
        uint256 amountInWithFee = amountBIn * 997; // 0.3% fee
        amountAOut = (amountInWithFee * reserveA) / (reserveB * 1000 + amountInWithFee);
        
        require(amountAOut >= minAmountAOut, "High slippage");
        require(amountAOut < reserveA, "Insufficient pool liquidity");

        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBIn);
        IERC20(tokenA).safeTransfer(msg.sender, amountAOut);

        reserveB += amountBIn;
        reserveA -= amountAOut;

        emit Swap(msg.sender, tokenB, tokenA, amountBIn, amountAOut);
        emit ReservesUpdated(reserveA, reserveB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256 amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function quoteSwapAForB(uint256 amountAIn) external view returns (uint256 amountBOut) {
        if (amountAIn == 0 || reserveA == 0 || reserveB == 0) return 0;
        return getAmountOut(amountAIn, reserveA, reserveB);
    }

    function quoteSwapBForA(uint256 amountBIn) external view returns (uint256 amountAOut) {
        if (amountBIn == 0 || reserveA == 0 || reserveB == 0) return 0;
        return getAmountOut(amountBIn, reserveB, reserveA);
    }

    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }

    function getUserLiquidity(address user) external view returns (uint256) {
        return liquidityProviderShares[user];
    }

    function getPoolShare(address user) external view returns (uint256 sharePPM) {
        if (totalLiquidity == 0) return 0;
        return (liquidityProviderShares[user] * 1000000) / totalLiquidity;
    }
}
