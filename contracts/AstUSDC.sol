// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AstUSDC - Arc Staked USDC Receipt Token
/// @notice Minted 1:1 when staking native USDC in ArcVault, burned on withdrawal
contract AstUSDC is ERC20, Ownable {
    address public vault;

    constructor() ERC20("Arc Staked USDC", "astUSDC") Ownable(msg.sender) {}

    function setVault(address _vault) external onlyOwner {
        vault = _vault;
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == vault, "Only vault");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == vault, "Only vault");
        _burn(from, amount);
    }
}
