// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ArcFXFactory.sol";
import "./ArcFXAMM.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ArcFXRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable factory;

    constructor(address _factory) {
        factory = _factory;
    }

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'ArcFXRouter: EXPIRED');
        _;
    }

    // --- Liquidity Functions ---

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pool = ArcFXFactory(factory).getPool(tokenA, tokenB);
        if (pool == address(0)) {
            pool = ArcFXFactory(factory).createPool(tokenA, tokenB);
        }

        // Simplification for this version: using desired amounts directly
        // In full Uniswap V2, this would calculate optimal amounts based on reserves
        amountA = amountADesired;
        amountB = amountBDesired;

        require(amountA >= amountAMin, "ArcFXRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "ArcFXRouter: INSUFFICIENT_B_AMOUNT");

        IERC20(tokenA).safeTransferFrom(msg.sender, pool, amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, pool, amountB);
        liquidity = ArcFXAMM(pool).addLiquidity(to);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        address pool = ArcFXFactory(factory).getPool(tokenA, tokenB);
        require(pool != address(0), "ArcFXRouter: POOL_NOT_FOUND");

        // Send LP tokens to the pool
        IERC20(pool).safeTransferFrom(msg.sender, pool, liquidity);
        
        // Burn and get tokens
        (amountA, amountB) = ArcFXAMM(pool).removeLiquidity(to);
        
        require(amountA >= amountAMin, "ArcFXRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "ArcFXRouter: INSUFFICIENT_B_AMOUNT");
    }

    // --- Swapping Functions ---

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        
        // In this version we only support direct pairs for simplicity
        // In a full version, we'd loop through the path and calculate amounts
        require(path.length == 2, "ArcFXRouter: ONLY_DIRECT_PAIRS_SUPPORTED_YET");
        
        address pool = ArcFXFactory(factory).getPool(path[0], path[1]);
        require(pool != address(0), "ArcFXRouter: POOL_NOT_FOUND");
        
        // Calculate amountOut off-chain or via helper (omitted here for brevity, assume caller provides correct amountOutMin)
        uint256 amountOut = ArcFXAMM(pool).getAmountOut(amountIn, path[0]);
        require(amountOut >= amountOutMin, "ArcFXRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        
        amounts[1] = amountOut;

        IERC20(path[0]).safeTransferFrom(msg.sender, pool, amountIn);
        ArcFXAMM(pool).swap(amountOut, path[1], to);
    }
}
