// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

contract ArcMultiFaucet is Ownable {
    mapping(address => uint256) public lastFaucetTime;
    uint256 public constant COOLDOWN = 24 hours;

    address[] public tokens;
    uint256[] public amounts;

    event FaucetClaimed(address indexed user, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setTokensAndAmounts(address[] calldata _tokens, uint256[] calldata _amounts) external onlyOwner {
        require(_tokens.length == _amounts.length, "Mismatch");
        tokens = _tokens;
        amounts = _amounts;
    }

    function claim() external {
        require(block.timestamp >= lastFaucetTime[msg.sender] + COOLDOWN, "Cooldown active");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            // We assume the faucet has tokens OR it is allowed to mint
            // In our case, ArcTokens are mintable by the owner. 
            // We will transfer tokens to Faucet or make Faucet a minter.
            try IMintable(tokens[i]).mint(msg.sender, amounts[i]) {
                // Mint success
            } catch {
                // If not mintable, try transfer (faucet must have balance)
                IERC20(tokens[i]).transfer(msg.sender, amounts[i]);
            }
        }

        lastFaucetTime[msg.sender] = block.timestamp;
        emit FaucetClaimed(msg.sender, block.timestamp);
    }

    function getNextAvailableTime(address user) external view returns (uint256) {
        return lastFaucetTime[user] + COOLDOWN;
    }
}
