// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {console2} from "forge-std/console2.sol";

/// @title DonationRouter
/// @notice Minimal splitter that forwards incoming ERC-20 funds to a list of receivers by basis points.
/// @dev Vault/strategy must approve this contract to pull tokens before calling `route`.
contract DonationRouter {
    using SafeERC20 for IERC20;

    struct Receiver {
        address account; // recipient address
        uint16 bps;      // share in basis points (out of 10_000)
    }

    Receiver[] public receivers;
    uint16 public constant MAX_BPS = 10_000;

    error InvalidConfig();

    event Donated(address indexed token, uint256 amount);

    /// @param _receivers receiver list; sum of bps must be exactly 10_000
    constructor(Receiver[] memory _receivers) {
        uint256 total;
        for (uint256 i = 0; i < _receivers.length; i++) {
            if (_receivers[i].account == address(0) || _receivers[i].bps == 0) revert InvalidConfig();
            receivers.push(_receivers[i]);
            total += _receivers[i].bps;
        }
        if (total != MAX_BPS) revert InvalidConfig();
    }

    /// @notice Pulls `amount` of `token` from caller and splits it to the configured receivers.
    /// @dev Caller must have approved this contract for `amount`.
    function route(address token, uint256 amount) external {
        console2.log("=== DONATION ROUTER: SPLITTING PROFIT ===");
        console2.log("Total profit to distribute:", amount);
        console2.log("Number of recipients:", receivers.length);
        
        // 1. Distribute to each receiver according to their bps share
        IERC20 erc = IERC20(token);
        uint256 totalDistributed = 0;

        
        for (uint256 i = 0; i < receivers.length; i++) {
            // 2. Calculate each receiver's share
            uint256 part = (amount * receivers[i].bps) / MAX_BPS;

            console2.log("Recipient", i + 1, "allocation:");
            console2.log("  -> Address:", receivers[i].account);
            console2.log("  -> Share (bps):", receivers[i].bps);
            console2.log("  -> Amount receiving:", part);
            
            // 3. Pull from caller then forward to each receiver.
            erc.safeTransferFrom(msg.sender, receivers[i].account, part);
            totalDistributed += part;

        }
        
        console2.log("Total distributed to public goods:", totalDistributed);
        console2.log("=== PUBLIC GOODS FUNDING COMPLETE ===\n");

        // 4. Emit event for off-chain tracking
        emit Donated(token, amount);

    }

    /// @return the number of configured receivers
    function receiversLength() external view returns (uint256) {
        return receivers.length;
    }
}
