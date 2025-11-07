// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {YDSVault} from "../src/contracts/YDSStrategy.sol";
import {Helpers} from "./Helpers.s.sol";

/// @title DemoDonate
/// @notice Seeds user funds, deposits into the vault, then triggers `harvest()`.
/// @dev If run against a mock adapter, it tries to bump yield before harvesting.
contract DemoDonate is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address vaultAddr = vm.envAddress("VAULT");
        address asset = vm.envAddress("UNDERLYING");
        uint256 depositAmount = vm.envOr("DEPOSIT", uint256(1_000e6)); // 1,000 USDC default

        vm.startBroadcast(pk);

        // Approve and deposit into the vault.
        IERC20(asset).approve(vaultAddr, type(uint256).max);
        YDSVault vault = YDSVault(vaultAddr);

        vault.deposit(depositAmount, msg.sender);

        // If using a mock adapter that exposes `bumpYield(uint256)`, try to call it to simulate profit.
        // This is a no-op on Aave since the function doesn't exist.
        // (We intentionally ignore return/revert via tryCall.)
        Helpers.tryCall(vaultAddr, abi.encodeWithSignature("bumpYield(uint256)", depositAmount / 10)); // +10%

        // Trigger donation of profit.
        vault.harvest();

        vm.stopBroadcast();
    }
}
