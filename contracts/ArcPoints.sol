// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ArcPoints is Ownable {
    struct UserInfo {
        uint256 totalPoints;
        uint256 lastCheckIn;
        uint256 currentStreak;
        uint256 totalSwaps;
        uint256 totalLiquidityAdded;
    }

    mapping(address => UserInfo) public users;
    address[] public userList;
    mapping(address => bool) public isUser;

    uint256 public constant CHECK_IN_POINTS = 50;
    uint256 public constant STREAK_BONUS = 10; // Extra 10 per day of streak
    uint256 public constant COOLDOWN = 24 hours;

    event PointsEarned(address indexed user, uint256 amount, string reason);
    event CheckedIn(address indexed user, uint256 timestamp, uint256 pointsEarned, uint256 streak);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function checkIn() external {
        UserInfo storage user = users[msg.sender];
        require(block.timestamp >= user.lastCheckIn + COOLDOWN, "Cooldown active");
        
        if (!isUser[msg.sender]) {
            isUser[msg.sender] = true;
            userList.push(msg.sender);
        }

        // Streak logic: if last check-in was within 48 hours, increment streak. Otherwise reset.
        if (block.timestamp <= user.lastCheckIn + 48 hours) {
            user.currentStreak += 1;
        } else {
            user.currentStreak = 1;
        }

        uint256 bonus = (user.currentStreak > 1) ? (user.currentStreak - 1) * STREAK_BONUS : 0;
        if (bonus > 100) bonus = 100; // Cap bonus

        uint256 totalEarned = CHECK_IN_POINTS + bonus;
        user.totalPoints += totalEarned;
        user.lastCheckIn = block.timestamp;

        emit CheckedIn(msg.sender, block.timestamp, totalEarned, user.currentStreak);
        emit PointsEarned(msg.sender, totalEarned, "Daily Check-in");
    }

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

    function getNextCheckInTime(address user) external view returns (uint256) {
        return users[user].lastCheckIn + COOLDOWN;
    }

    function getNextSnapshotTime() external view returns (uint256) {
        // Returns the next UTC 00:00 timestamp
        return ((block.timestamp / 86400) + 1) * 86400;
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
