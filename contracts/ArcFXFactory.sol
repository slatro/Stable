// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ArcFXAMM.sol";

contract ArcFXFactory {
    address public feeTo;
    address public feeToSetter;

    mapping(address => mapping(address => address)) public getPool;
    address[] public allPools;

    event PoolCreated(address indexed token0, address indexed token1, address pool, uint256);

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;
        feeTo = _feeToSetter;
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function createPool(address tokenA, address tokenB) external returns (address pool) {
        require(tokenA != tokenB, 'ArcFX: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ArcFX: ZERO_ADDRESS');
        require(getPool[token0][token1] == address(0), 'ArcFX: POOL_EXISTS');

        pool = address(new ArcFXAMM(token0, token1));
        
        getPool[token0][token1] = pool;
        getPool[token1][token0] = pool; // populate mapping for both directions
        allPools.push(pool);
        
        emit PoolCreated(token0, token1, pool, allPools.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, 'ArcFX: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, 'ArcFX: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}
