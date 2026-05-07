// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ArcFXAMM.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract ArcFXFactory {
    mapping(address => mapping(address => address)) public getPool;
    address[] public allPools;
    address public treasury;

    event PoolCreated(address indexed token0, address indexed token1, address pool, uint256);

    constructor(address _treasury) {
        treasury = _treasury;
    }

    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    function createPool(address tokenA, address tokenB) external returns (address pool) {
        require(tokenA != tokenB, "ArcFX: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "ArcFX: ZERO_ADDRESS");
        require(getPool[token0][token1] == address(0), "ArcFX: POOL_EXISTS");

        string memory symbol0 = IERC20Metadata(token0).symbol();
        string memory symbol1 = IERC20Metadata(token1).symbol();
        
        string memory name = string(abi.encodePacked("ArcFX LP - ", symbol0, "/", symbol1));
        string memory symbol = string(abi.encodePacked("AFX-LP-", symbol0, "-", symbol1));

        pool = address(new ArcFXAMM(token0, token1, name, symbol, treasury));
        
        getPool[token0][token1] = pool;
        getPool[token1][token0] = pool; 
        allPools.push(pool);
        
        emit PoolCreated(token0, token1, pool, allPools.length);
    }
}
