// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./AstUSDC.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArcVault - Native USDC Staking Vault
/// @notice Accepts native USDC (Arc Testnet gas token), mints astUSDC 1:1
/// @notice On withdraw: burns astUSDC, returns native USDC
contract ArcVault is ReentrancyGuard {
    AstUSDC public immutable astUsdc;
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _astUsdc) {
        astUsdc = AstUSDC(_astUsdc);
    }

    /// @notice Stake native USDC, receive astUSDC 1:1
    function stake() external payable nonReentrant {
        require(msg.value > 0, "Zero amount");
        astUsdc.mint(msg.sender, msg.value);
        totalStaked += msg.value;
        emit Staked(msg.sender, msg.value);
    }

    /// @notice Burn astUSDC, receive native USDC 1:1
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero amount");
        require(astUsdc.balanceOf(msg.sender) >= amount, "Insufficient astUSDC");
        astUsdc.burn(msg.sender, amount);
        totalStaked -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Returns staked balance of a user (via their astUSDC balance)
    function stakedBalance(address user) external view returns (uint256) {
        return astUsdc.balanceOf(user);
    }

    receive() external payable {}
}
