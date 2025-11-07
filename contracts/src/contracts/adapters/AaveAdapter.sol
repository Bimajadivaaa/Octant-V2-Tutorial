// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {console2} from "forge-std/console2.sol";

/// @dev Minimal Aave V3 pool interface (only what we use).
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

/// @dev aToken exposes underlying balance accounting 1:1 (subject to index).
interface IAToken {
    function balanceOf(address user) external view returns (uint256);
}

/// @title AaveAdapter
/// @notice Thin owner-only adapter used by the vault to interact with Aave V3.
/// @dev The vault is the immutable `owner`. This contract holds the aTokens.
contract AaveAdapter {
    using SafeERC20 for IERC20;

    address public immutable OWNER;     // vault address
    address public immutable UNDERLYING;
    IAavePool public immutable POOL;
    IAToken public immutable ATOKEN;

    error NotOwner();

    modifier onlyOwner() {
        if (msg.sender != OWNER) revert NotOwner();
        _;
    }

    /// @param _underlying ERC-20 asset deposited into Aave
    /// @param _pool       Aave V3 pool
    /// @param _aToken     corresponding aToken
    /// @param _owner      vault that controls this adapter
    constructor(address _underlying, address _pool, address _aToken, address _owner) {
        OWNER = _owner;
        UNDERLYING = _underlying;
        POOL = IAavePool(_pool);
        ATOKEN = IAToken(_aToken);

        // Pre-approve the pool to pull unlimited underlying from this adapter.
        IERC20(_underlying).approve(_pool, type(uint256).max);
    }

    /// @notice Called by the vault to move `amount` underlying from the vault into Aave.
    function deposit(uint256 amount) external onlyOwner {
        console2.log("=== AAVE ADAPTER: INVESTING FOR YIELD ===");
        console2.log("Transferring assets to Aave for yield generation:", amount);
        
        // Pull underlying from the vault and supply to Aave on behalf of this adapter.
        IERC20(UNDERLYING).safeTransferFrom(msg.sender, address(this), amount);
        console2.log("Assets received by adapter from vault");
        
        POOL.supply(UNDERLYING, amount, address(this), 0);
        console2.log("Assets supplied to Aave V3 pool - Now earning yield!");
        console2.log("aToken balance:", ATOKEN.balanceOf(address(this)));
        console2.log("=== YIELD GENERATION STARTED ===\n");
    }

    /// @notice Withdraws underlying from Aave back to the vault.
    /// @return withdrawn amount actually returned by Aave
    function withdraw(uint256 amount) external onlyOwner returns (uint256) {
        console2.log("=== AAVE ADAPTER: WITHDRAWING ASSETS ===");
        console2.log("Requested withdrawal amount:", amount);
        console2.log("aToken balance before withdrawal:", ATOKEN.balanceOf(address(this)));
        
        uint256 withdrawn = POOL.withdraw(UNDERLYING, amount, OWNER);
        
        console2.log("Assets withdrawn from Aave:", withdrawn);
        console2.log("Remaining aToken balance:", ATOKEN.balanceOf(address(this)));
        console2.log("=== WITHDRAWAL FROM AAVE COMPLETE ===\n");
        
        return withdrawn;
    }

    /// @notice Total underlying attributed to this adapter (via aToken balance).
    function totalAssets() external view returns (uint256) {
        return ATOKEN.balanceOf(address(this));
    }

    /// @notice Exposes the underlying asset address to the vault.
    function asset() external view returns (address) {
        return UNDERLYING;
    }
}
