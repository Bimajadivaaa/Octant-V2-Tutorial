// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {console2} from "forge-std/console2.sol";

/// @dev Adapter surface the vault expects.
interface IYieldAdapterLike {
    // 1. Add the methods the vault will call on the adapter
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external returns (uint256);
    function totalAssets() external view returns (uint256);
    function asset() external view returns (address);  
}

/// @dev Minimal interface for the DonationRouter.
interface IDonationRouter {
    function route(address token, uint256 amount) external;
}

/// @title YDSVault (minimal)
/// @notice ERC-4626 vault that invests into a yield adapter and donates realized profit on `harvest()`.
/// @dev This is an MVP “YDS-style” example for tutorials. It does NOT implement full
///      donation-shares loss absorption like a production YDS. Use for demos/education.
contract YDSVault is ERC4626 {
    using SafeERC20 for IERC20;

    IYieldAdapterLike public adapter;
    IDonationRouter public router;

    /// @notice High-water mark of total assets used to compute profit.
    uint256 public lastRecordedAssets;

    event Harvest(uint256 totalAssetsBefore, uint256 profit, uint256 donated);

    /// @param asset_  underlying ERC-20
    /// @param name_   ERC-20 name for the share token
    /// @param symbol_ ERC-20 symbol for the share token
    /// @param adapter_ yield adapter address
    /// @param router_  donation router address
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address adapter_,
        address router_
    ) ERC20(name_, symbol_) ERC4626(asset_) {
        adapter = IYieldAdapterLike(adapter_);
        router  = IDonationRouter(router_);
        // Safety: enforce adapter’s underlying matches the vault’s asset.
        require(address(asset_) == adapter.asset(), "ASSET_MISMATCH");
        // Initialize watermark to zero; will be synced on first deposit.
    }

    /// @notice Update the adapter (for testing purposes)
    /// @dev Only for testing - production contracts shouldn't have this
    function setAdapter(address adapter_) external {
        // 2. Add access control as needed
        adapter = IYieldAdapterLike(adapter_);
        require(address(asset()) == adapter.asset(), "Asset Missmatch");
    }

    // =============================================================
    //                      ERC4626 OVERRIDES
    // =============================================================

    /// @dev Override ERC4626 _deposit to push funds into adapter after deposit
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        console2.log("=== OCTANT V2 DEPOSIT FLOW ===");
        console2.log("1. User depositing assets:", assets);
        console2.log("2. Minting shares to user:", shares);
        console2.log("3. User address:", receiver);
        
        // 3. Add deposit logic first
        super._deposit(caller, receiver, assets, shares);

        
        console2.log("4. Vault balance before adapter deposit:", IERC20(address(asset())).balanceOf(address(this)));
        
        // 4. Push funds into the adapter so capital is productive
        IERC20(address(asset())).safeIncreaseAllowance(address(adapter), assets);
        adapter.deposit(assets);

        
        console2.log("5. Funds sent to yield adapter for productive investment");
        console2.log("6. Updated total assets:", totalAssets());
        
        _syncWatermark();
        console2.log("7. Last record assets (Watermark) updated to:", lastRecordedAssets);
        console2.log("=== DEPOSIT COMPLETE ===");
    }

    /// @dev Override ERC4626 _withdraw to pull liquidity from adapter before withdrawal
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares) internal override {
        console2.log("=== OCTANT V2 WITHDRAWAL FLOW ===");
        console2.log("1. User withdrawing assets:", assets);
        console2.log("2. Burning shares from user:", shares);
        console2.log("3. User address:", receiver);
        console2.log("4. Total assets before withdrawal:", totalAssets());
        
        // 5. Pull liquidity back from the adapter
        uint256 withdrawn = adapter.withdraw(assets);
        console2.log("5. Assets withdrawn from yield adapter:", withdrawn);
        
        // 6. Complete the withdrawal first
        super._withdraw(caller, receiver, owner, assets, shares);

        console2.log("6. Assets transferred to user:", assets);
        
        // Sync watermark after withdrawal is complete
        _syncWatermark();
        console2.log("7. Updated watermark:", lastRecordedAssets);
        console2.log("8. Remaining total assets:", totalAssets());
        console2.log("=== WITHDRAWAL COMPLETE ===\n");
    }

    /// @dev Vault AUM = loose assets in vault + assets held by the adapter.
    function totalAssets() public view override returns (uint256) {
        // 7. Add total assets logic
        uint256 loose = IERC20(address(asset())).balanceOf(address(this));
        uint256 invested = adapter.totalAssets();
        return loose + invested;
    }

    // =============================================================
    //                       DONATE-ON-HARVEST
    // =============================================================

    /// @notice Realizes profit relative to the high-water mark and donates it via the router.
    /// @dev For simplicity, only positive deltas are donated. Loss handling is out of scope for MVP.
    function harvest() external {
        console2.log("=== OCTANT V2 HARVEST & DONATION FLOW ===");
        
        uint256 ta = totalAssets();
        console2.log("1. Current total assets:", ta);
        console2.log("2. Last recorded assets (watermark):", lastRecordedAssets);
        
        uint256 profit = ta > lastRecordedAssets ? ta - lastRecordedAssets : 0;
        console2.log("3. Calculated profit for donation:", profit);

        if (profit > 0) {
            console2.log("4. PROFIT DETECTED - Starting donation process...");
            
            // 8. Pull back exactly the profit from the adapter to this vault.
            adapter.withdraw(profit);

            console2.log("5. Profit withdrawn from yield adapter");

            // 9. Approve the router to pull `profit` and split to receivers.
            IERC20(address(asset())).safeIncreaseAllowance(address(router), profit);

            console2.log("6. Approved donation router to spend profit");
            
            // 10. Route the profit to the donation router.
            router.route(address(asset()), profit);

            console2.log("7. Profit donated to public goods recipients!");
            console2.log("   -> This profit came from YIELD, not user principal");
        } else {
            console2.log("4. No profit to donate yet (yield still generating)");
        }

        emit Harvest(ta, profit, profit);
        _syncWatermark();
        console2.log("8. Watermark updated to:", lastRecordedAssets);
        console2.log("9. USER PRINCIPAL REMAINS INTACT - Only yield was donated");
        console2.log("=== HARVEST COMPLETE ===\n");
    }

    /// @dev Updates the high-water mark to current AUM.
    function _syncWatermark() internal {
        // 11. Update watermark logic
        lastRecordedAssets = totalAssets();
        
    }
}
