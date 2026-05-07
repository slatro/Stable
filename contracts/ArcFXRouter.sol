// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ArcFXFactory.sol";
import "./ArcFXAMM.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ArcFXRouter {
    using SafeERC20 for IERC20;

    address public immutable factory;

    constructor(address _factory) {
        factory = _factory;
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        address to
    ) external returns (uint256 liquidity) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 amount0, uint256 amount1) = tokenA < tokenB ? (amountA, amountB) : (amountB, amountA);

        address pool = ArcFXFactory(factory).getPool(token0, token1);
        if (pool == address(0)) {
            pool = ArcFXFactory(factory).createPool(token0, token1);
        }

        IERC20(token0).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(token1).safeTransferFrom(msg.sender, address(this), amount1);

        IERC20(token0).approve(pool, amount0);
        IERC20(token1).approve(pool, amount1);

        liquidity = ArcFXAMM(pool).addLiquidity(amount0, amount1, to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        address to
    ) external returns (uint256 amount0, uint256 amount1) {
        address pool = ArcFXFactory(factory).getPool(tokenA, tokenB);
        require(pool != address(0), "POOL_NOT_FOUND");

        // User must approve Router to spend LP tokens (which is the pool address itself)
        IERC20(pool).safeTransferFrom(msg.sender, address(this), liquidity);
        IERC20(pool).approve(pool, liquidity); // In our AMM, shares are handled via mapping, but let's be safe

        (amount0, amount1) = ArcFXAMM(pool).removeLiquidity(liquidity, to);
    }

    function swapExactTokensForTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to
    ) external returns (uint256 amountOut) {
        address pool = ArcFXFactory(factory).getPool(tokenIn, tokenOut);
        require(pool != address(0), "POOL_NOT_FOUND");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(pool, amountIn);

        amountOut = ArcFXAMM(pool).swap(tokenIn, amountIn, minAmountOut, to);
    }

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns (uint256) {
        address pool = ArcFXFactory(factory).getPool(tokenIn, tokenOut);
        if (pool == address(0)) return 0;
        return ArcFXAMM(pool).getAmountOut(amountIn, tokenIn);
    }
}
