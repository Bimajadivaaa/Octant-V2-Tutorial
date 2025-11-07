// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {YDSVault} from "../src/contracts/YDSStrategy.sol";
import {AaveAdapter} from "../src/contracts/adapters/AaveAdapter.sol";
import {DonationRouter} from "../src/contracts/utils/DonationRouter.sol";
import {Helpers} from "./Helpers.s.sol";

/// @title Deploy
/// @notice Deploys DonationRouter, AaveAdapter (or your mock), and YDSVault.
/// @dev Designed for a mainnet-fork demo. Provide env vars for real Aave addresses.
contract Deploy is Script {
    function run() external {
        // Required env vars:
        // PRIVATE_KEY, RECIPIENT_1, RECIPIENT_2,
        // UNDERLYING (USDC), AAVE_POOL, ATOKEN
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);

        // 1) DonationRouter with two receivers (7000/3000 by default).
        DonationRouter router = new DonationRouter(Helpers.buildTwoReceivers());

        // 2) AaveAdapter owned by the vault (we don't have the vault address yet),
        //    so we first deploy a temporary adapter then re-deploy with the vault as owner.
        address underlying = vm.envAddress("UNDERLYING");
        address pool = vm.envAddress("AAVE_POOL");
        address aToken = vm.envAddress("ATOKEN");

        // Temporary adapter with owner set to EOA (will not be used).
        new AaveAdapter(underlying, pool, aToken, msg.sender);

        // 3) Deploy a "placeholder" adapter with owner set to zero,
        //    then deploy the vault and a final adapter with correct owner.
        //    (Adapters are cheap; this keeps the script simple and explicit.)
        AaveAdapter adapter = new AaveAdapter(underlying, pool, aToken, address(0));

        // 4) Vault (asset sanity-checked against adapter.asset()).
        YDSVault vault = new YDSVault(
            IERC20(underlying),
            "YDS Octant Vault",
            "YDSOV",
            address(adapter),
            address(router)
        );

        // 5) Final adapter with correct owner (vault). You will use this instance.
        AaveAdapter finalAdapter = new AaveAdapter(underlying, pool, aToken, address(vault));

        // Optional: update the vault's adapter if your vault supports it (our MVP keeps it in constructor).
        // For this MVP, simply use `finalAdapter` address in your .env and frontend.

        vm.stopBroadcast();

        console2.log("DonationRouter:", address(router));
        console2.log("Vault         :", address(vault));
        console2.log("Adapter(OK)   :", address(finalAdapter));
    }
}
