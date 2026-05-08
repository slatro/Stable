// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArcFXStaking (astUSDC)
 * @dev Liquid Staking for USDC. Users deposit USDC and receive astUSDC shares.
 * Optimized for Arc Testnet Native USDC (6 decimals).
 */
contract ArcFXStaking is ERC20, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    uint256 public lastUpdate;

    constructor(address _usdc) ERC20("Staked Arc Dollar", "astUSDC") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        lastUpdate = block.timestamp;
    }

    /**
     * @dev Override decimals to match USDC (6 decimals).
     */
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev Stake USDC and mint astUSDC shares.
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        
        uint256 totalUSDC = usdc.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        
        uint256 sharesToMint;
        if (totalShares == 0 || totalUSDC == 0) {
            sharesToMint = amount;
        } else {
            sharesToMint = (amount * totalShares) / totalUSDC;
        }
        
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        _mint(msg.sender, sharesToMint);
    }

    /**
     * @dev Unstake USDC by burning astUSDC shares.
     */
    function unstake(uint256 shares) external nonReentrant {
        require(shares > 0, "Shares must be > 0");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        uint256 totalUSDC = usdc.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        
        uint256 amountToReturn = (shares * totalUSDC) / totalShares;
        
        _burn(msg.sender, shares);
        usdc.safeTransfer(msg.sender, amountToReturn);
    }

    /**
     * @dev Simulated reward distribution.
     */
    function distributeRewards(uint256 amount) external onlyOwner {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Returns how much USDC 1 astUSDC is worth (scaled to 1e6).
     */
    function getExchangeRate() public view returns (uint256) {
        uint256 totalUSDC = usdc.balanceOf(address(this));
        uint256 totalShares = totalSupply();
        if (totalShares == 0) return 1e6; // 1:1 initial
        return (totalUSDC * 1e6) / totalShares;
    }
}
