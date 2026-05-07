// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ArcFXFarm is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // UserInfo records a user's deposited LP tokens and reward debts
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
    }

    // PoolInfo records the state of an LP pool in the farm
    struct PoolInfo {
        IERC20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool.
        uint256 lastRewardTime;   // Last timestamp that ARC distribution occurs.
        uint256 accArcPerShare;   // Accumulated ARC per share, times 1e12.
    }

    IERC20 public arcToken;
    uint256 public arcPerSecond;
    uint256 public totalAllocPoint = 0;

    PoolInfo[] public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(IERC20 _arcToken, uint256 _arcPerSecond) Ownable(msg.sender) {
        arcToken = _arcToken;
        arcPerSecond = _arcPerSecond;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    function add(uint256 _allocPoint, IERC20 _lpToken, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardTime = block.timestamp;
        totalAllocPoint = totalAllocPoint + _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accArcPerShare: 0
        }));
    }

    // Update the given pool's ARC allocation point. Can only be called by the owner.
    function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // View function to see pending ARCs on frontend.
    function pendingArc(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accArcPerShare = pool.accArcPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0 && totalAllocPoint > 0) {
            uint256 multiplier = block.timestamp - pool.lastRewardTime;
            uint256 arcReward = (multiplier * arcPerSecond * pool.allocPoint) / totalAllocPoint;
            accArcPerShare = accArcPerShare + ((arcReward * 1e12) / lpSupply);
        }
        return (user.amount * accArcPerShare / 1e12) - user.rewardDebt;
    }

    // Update reward variables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0 || pool.allocPoint == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        uint256 multiplier = block.timestamp - pool.lastRewardTime;
        uint256 arcReward = (multiplier * arcPerSecond * pool.allocPoint) / totalAllocPoint;
        
        // We assume the Farm contract already holds enough ARC balance for rewards
        pool.accArcPerShare = pool.accArcPerShare + ((arcReward * 1e12) / lpSupply);
        pool.lastRewardTime = block.timestamp;
    }

    // Deposit LP tokens to Farm for ARC allocation.
    function deposit(uint256 _pid, uint256 _amount) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accArcPerShare / 1e12) - user.rewardDebt;
            if (pending > 0) {
                safeArcTransfer(msg.sender, pending);
                emit Harvest(msg.sender, _pid, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount + _amount;
        }
        user.rewardDebt = user.amount * pool.accArcPerShare / 1e12;
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from Farm.
    function withdraw(uint256 _pid, uint256 _amount) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending = (user.amount * pool.accArcPerShare / 1e12) - user.rewardDebt;
        if (pending > 0) {
            safeArcTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        if (_amount > 0) {
            user.amount = user.amount - _amount;
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount * pool.accArcPerShare / 1e12;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Safe arc transfer function, just in case if rounding error causes pool to not have enough ARCs.
    function safeArcTransfer(address _to, uint256 _amount) internal {
        uint256 arcBal = arcToken.balanceOf(address(this));
        if (_amount > arcBal) {
            arcToken.transfer(_to, arcBal);
        } else {
            arcToken.transfer(_to, _amount);
        }
    }
}
