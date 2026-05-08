// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcPoints is Ownable {
    struct UserInfo {
        uint256 totalPoints;
        uint256 lastCheckIn;
        uint256 totalSwaps;
        uint256 totalLiquidityAdded;
    }

    mapping(address => UserInfo) public users;
    address[] public userList;
    mapping(address => bool) public isUser;

    uint256 public constant CHECK_IN_POINTS = 50;
    uint256 public constant COOLDOWN = 24 hours;

    event PointsEarned(address indexed user, uint256 amount, string reason);
    event CheckedIn(address indexed user, uint256 timestamp);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function checkIn() external {
        require(block.timestamp >= users[msg.sender].lastCheckIn + COOLDOWN, "Cooldown active");
        
        if (!isUser[msg.sender]) {
            isUser[msg.sender] = true;
            userList.push(msg.sender);
        }

        users[msg.sender].totalPoints += CHECK_IN_POINTS;
        users[msg.sender].lastCheckIn = block.timestamp;

        emit CheckedIn(msg.sender, block.timestamp);
        emit PointsEarned(msg.sender, CHECK_IN_POINTS, "Daily Check-in");
    }

    // This would be called by the Router or other contracts in a real scenario
    // For our demo, we can allow the owner to record activity or simulate it
    function recordActivity(address user, uint256 points, string calldata reason) external onlyOwner {
        if (!isUser[user]) {
            isUser[user] = true;
            userList.push(user);
        }
        users[user].totalPoints += points;
        emit PointsEarned(user, points, reason);
    }

    function getUserPoints(address user) external view returns (uint256) {
        return users[user].totalPoints;
    }

    function getLeaderboard() external view returns (address[] memory, uint256[] memory) {
        uint256 len = userList.length;
        address[] memory addresses = new address[](len);
        uint256[] memory points = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            addresses[i] = userList[i];
            points[i] = users[userList[i]].totalPoints;
        }

        return (addresses, points);
    }
}
