// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcFXAMM is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    address public immutable token0;
    address public immutable token1;
    uint8 public immutable decimals0;
    uint8 public immutable decimals1;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityShares;

    constructor(address _token0, address _token1) Ownable(msg.sender) {
        token0 = _token0;
        token1 = _token1;
        decimals0 = IERC20Metadata(_token0).decimals();
        decimals1 = IERC20Metadata(_token1).decimals();
    }

    // --- Core Functions ---

    function addLiquidity(uint256 amount0, uint256 amount1, address to) external nonReentrant returns (uint256 liquidity) {
        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        uint256 norm0 = _normalize(amount0, decimals0);
        uint256 norm1 = _normalize(amount1, decimals1);
        uint256 normRes0 = _normalize(reserve0, decimals0);
        uint256 normRes1 = _normalize(reserve1, decimals1);

        if (totalLiquidity == 0) {
            liquidity = Math.sqrt(norm0 * norm1);
        } else {
            liquidity = Math.min(
                (norm0 * totalLiquidity) / normRes0,
                (norm1 * totalLiquidity) / normRes1
            );
        }

        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");
        
        reserve0 += amount0;
        reserve1 += amount1;
        totalLiquidity += liquidity;
        liquidityShares[to] += liquidity;
    }

    function removeLiquidity(uint256 liquidity, address to) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(liquidityShares[msg.sender] >= liquidity, "INSUFFICIENT_LIQUIDITY");

        amount0 = (liquidity * reserve0) / totalLiquidity;
        amount1 = (liquidity * reserve1) / totalLiquidity;

        liquidityShares[msg.sender] -= liquidity;
        totalLiquidity -= liquidity;
        reserve0 -= amount0;
        reserve1 -= amount1;

        IERC20(token0).safeTransfer(to, amount0);
        IERC20(token1).safeTransfer(to, amount1);
    }

    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut, address to) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn == token0 || tokenIn == token1, "INVALID_TOKEN");
        bool isToken0 = tokenIn == token0;
        (address tIn, address tOut) = isToken0 ? (token0, token1) : (token1, token0);
        (uint256 resIn, uint256 resOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);
        (uint8 decIn, uint8 decOut) = isToken0 ? (decimals0, decimals1) : (decimals1, decimals0);

        uint256 normIn = _normalize(amountIn, decIn);
        uint256 normResIn = _normalize(resIn, decIn);
        uint256 normResOut = _normalize(resOut, decOut);

        // 0.1% Fee (Reduced from 0.3%)
        uint256 amountInWithFee = (normIn * 999) / 1000;
        uint256 normOut = (amountInWithFee * normResOut) / (normResIn + amountInWithFee);
        amountOut = _denormalize(normOut, decOut);

        require(amountOut >= minAmountOut, "INSUFFICIENT_OUTPUT_AMOUNT");

        IERC20(tIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tOut).safeTransfer(to, amountOut);

        if (isToken0) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }
    }

    // --- Helpers ---

    function _normalize(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount;
        if (decimals < 18) return amount * (10**(18 - decimals));
        return amount / (10**(decimals - 18));
    }

    function _denormalize(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount;
        if (decimals < 18) return amount / (10**(18 - decimals));
        return amount * (10**(decimals - 18));
    }

    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256) {
        bool isToken0 = tokenIn == token0;
        (uint256 resIn, uint256 resOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);
        (uint8 decIn, uint8 decOut) = isToken0 ? (decimals0, decimals1) : (decimals1, decimals0);
        
        uint256 normIn = _normalize(amountIn, decIn);
        uint256 amountInWithFee = (normIn * 999) / 1000;
        uint256 normOut = (amountInWithFee * _normalize(resOut, decOut)) / (_normalize(resIn, decIn) + amountInWithFee);
        return _denormalize(normOut, decOut);
    }
}
