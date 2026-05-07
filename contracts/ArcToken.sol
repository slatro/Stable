// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcToken is ERC20, Ownable {
    constructor() ERC20("ArcFX Token", "ARC") Ownable(msg.sender) {
        // Mint 100 Million ARC tokens to the deployer for testnet distribution
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
