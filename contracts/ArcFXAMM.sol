// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title ArcFXAMM - Professional Stablecoin AMM
 * @notice Implements Constant Product AMM with Decimal Normalization, Pausable trading, and Protocol Fees.
 */
contract ArcFXAMM is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    address public immutable tokenA;
    address public immutable tokenB;
    uint8 public immutable decimalsA;
    uint8 public immutable decimalsB;

    uint256 public reserveA;
    uint256 public reserveB;

    uint256 public totalLiquidity;
    mapping(address => uint256) public liquidityProviderShares;

    address public treasury;
    uint256 public protocolFeeShare = 166; // ~16.6% of the 0.3% fee (5 basis points total)
    uint256 public constant FEE_DENOMINATOR = 100000;
    uint256 public constant TOTAL_SWAP_FEE = 300; // 0.3% = 300/100000 ? No, let's use 1000 for simplicity as before but more precise.
    
    // Using 10000 as denominator for 0.3% fee (30/10000)
    uint256 public constant SWAP_FEE_BPS = 30; // 0.3%
    uint256 public constant PROTOCOL_FEE_BPS = 5; // 0.05% out of the 0.3%

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityMinted);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidityBurned);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event ReservesUpdated(uint256 reserveA, uint256 reserveB);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    constructor(address _tokenA, address _tokenB, address _treasury) Ownable(msg.sender) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid tokens");
        require(_treasury != address(0), "Invalid treasury");
        tokenA = _tokenA;
        tokenB = _tokenB;
        decimalsA = IERC20Metadata(_tokenA).decimals();
        decimalsB = IERC20Metadata(_tokenB).decimals();
        treasury = _treasury;
    }

    // --- Admin Functions ---

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, _newTreasury);
        treasury = _newTreasury;
    }

    // --- Core AMM Logic ---

    function addLiquidity(uint256 amountA, uint256 amountB) external whenNotPaused nonReentrant returns (uint256 liquidity) {
        require(amountA > 0 && amountB > 0, "Insufficient amounts");

        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountB);

        // Normalize amounts to 18 decimals for internal math
        uint256 normA = _normalize(amountA, decimalsA);
        uint256 normB = _normalize(amountB, decimalsB);
        uint256 normReserveA = _normalize(reserveA, decimalsA);
        uint256 normReserveB = _normalize(reserveB, decimalsB);

        if (totalLiquidity == 0) {
            liquidity = Math.sqrt(normA * normB);
        } else {
            liquidity = Math.min(
                (normA * totalLiquidity) / normReserveA,
                (normB * totalLiquidity) / normReserveB
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

    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external whenNotPaused nonReentrant returns (uint256 amountOut) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");
        require(amountIn > 0, "Insufficient input");

        bool isAIn = tokenIn == tokenA;
        (address tIn, address tOut) = isAIn ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 resIn, uint256 resOut) = isAIn ? (reserveA, reserveB) : (reserveB, reserveA);
        (uint8 decIn, uint8 decOut) = isAIn ? (decimalsA, decimalsB) : (decimalsB, decimalsA);

        // Normalize for math
        uint256 normIn = _normalize(amountIn, decIn);
        uint256 normResIn = _normalize(resIn, decIn);
        uint256 normResOut = _normalize(resOut, decOut);

        // Fee calculation (0.3% total)
        uint256 feeAmount = (normIn * SWAP_FEE_BPS) / 10000;
        uint256 protocolFee = (normIn * PROTOCOL_FEE_BPS) / 10000;
        uint256 amountInWithFee = normIn - feeAmount;

        // Constant Product Formula: dy = (y * dx) / (x + dx)
        uint256 normOut = (amountInWithFee * normResOut) / (normResIn + amountInWithFee);
        amountOut = _denormalize(normOut, decOut);

        require(amountOut >= minAmountOut, "High slippage");
        require(amountOut < resOut, "Insufficient liquidity");

        // Execute transfers
        IERC20(tIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Handle protocol fee (Treasury gets its slice)
        if (protocolFee > 0) {
            uint256 treasuryAmount = _denormalize(protocolFee, decIn);
            if (treasuryAmount > 0) {
                IERC20(tIn).safeTransfer(treasury, treasuryAmount);
                if (isAIn) reserveA -= treasuryAmount; else reserveB -= treasuryAmount;
            }
        }

        IERC20(tOut).safeTransfer(msg.sender, amountOut);

        if (isAIn) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        emit Swap(msg.sender, tIn, tOut, amountIn, amountOut);
        emit ReservesUpdated(reserveA, reserveB);
    }

    // --- Helpers ---

    function _normalize(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount;
        return amount * (10**(18 - decimals));
    }

    function _denormalize(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) return amount;
        return amount / (10**(18 - decimals));
    }

    function getAmountOut(uint256 amountIn, address tokenIn) external view returns (uint256) {
        bool isAIn = tokenIn == tokenA;
        (uint256 resIn, uint256 resOut) = isAIn ? (reserveA, reserveB) : (reserveB, reserveA);
        (uint8 decIn, uint8 decOut) = isAIn ? (decimalsA, decimalsB) : (decimalsB, decimalsA);

        uint256 normIn = _normalize(amountIn, decIn);
        uint256 normResIn = _normalize(resIn, decIn);
        uint256 normResOut = _normalize(resOut, decOut);

        uint256 amountInWithFee = normIn - ((normIn * SWAP_FEE_BPS) / 10000);
        uint256 normOut = (amountInWithFee * normResOut) / (normResIn + amountInWithFee);
        return _denormalize(normOut, decOut);
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

