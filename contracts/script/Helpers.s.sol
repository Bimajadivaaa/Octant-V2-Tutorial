// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Vm} from "forge-std/Vm.sol";
import {DonationRouter} from "../src/contracts/utils/DonationRouter.sol";

library Helpers {
    /// @notice Build a 2-receiver array for DonationRouter using env vars.
    /// @dev Expects RECIPIENT_1 and RECIPIENT_2 and BPS_1 (BPS_2 = 10_000 - BPS_1).
    function buildTwoReceivers() internal view returns (DonationRouter.Receiver[] memory) {
        Vm vm = Vm(address(bytes20(uint160(uint256(keccak256("hevm cheat code"))))));
        
        address r1 = vm.envAddress("RECIPIENT_1");
        address r2 = vm.envAddress("RECIPIENT_2");
        uint256 bps1 = vm.envOr("BPS_1", uint256(7000));

        DonationRouter.Receiver[] memory rec = new DonationRouter.Receiver[](2);
        rec[0] = DonationRouter.Receiver({account: r1, bps: uint16(bps1)});
        rec[1] = DonationRouter.Receiver({account: r2, bps: uint16(10_000 - bps1)});
        return rec;
    }

    /// @notice Try to call an optional function on a target (used for mocks).
    /// @dev If the function does not exist, this does nothing (no revert).
    function tryCall(address target, bytes memory data) internal {
        (bool ok, ) = target.call(data);
        ok; // silence warning; intentionally ignored
    }
}
