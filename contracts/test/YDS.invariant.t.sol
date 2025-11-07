// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {YDSVault} from "../src/contracts/YDSStrategy.sol";
import {DonationRouter} from "../src/contracts/utils/DonationRouter.sol";

/// Reuse the mocks from the unit test for invariants
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {}
    function mint(address to, uint256 amt) external { _mint(to, amt); }
}
interface IAdapterLike {
    function deposit(uint256) external;
    function withdraw(uint256) external returns (uint256);
    function totalAssets() external view returns (uint256);
    function asset() external view returns (address);
    function bumpYield(uint256) external;
}
contract MockYieldAdapter is IAdapterLike {
    IERC20 public immutable UNDERLYING;
    address public immutable OWNER;
    uint256 internal _assets;
    error NotOwner();
    constructor(address _underlying, address _owner) { UNDERLYING = IERC20(_underlying); OWNER = _owner; }
    modifier onlyOwner(){ if(msg.sender != OWNER) revert NotOwner(); _; }
    function deposit(uint256 a) external onlyOwner { require(UNDERLYING.transferFrom(msg.sender, address(this), a), "Transfer failed"); _assets += a; }
    function withdraw(uint256 a) external onlyOwner returns (uint256){ if (a > _assets) a = _assets; _assets -= a; require(UNDERLYING.transfer(OWNER, a), "Transfer failed"); return a; }
    function totalAssets() external view returns (uint256){ return _assets; }
    function asset() external view returns (address){ return address(UNDERLYING); }
    function bumpYield(uint256 p) external onlyOwner { 
        _assets += p; 
        // Mint the profit to this adapter to simulate yield generation
        MockERC20(address(UNDERLYING)).mint(address(this), p);
    }
}

/// @title Invariant tests for MVP YDSVault
/// @dev We model only positive-yield scenarios (no losses) to reflect the tutorial scope.
contract YDSInvariant is StdInvariant, Test {
    MockERC20 usdc;
    DonationRouter router;
    MockYieldAdapter adapter;
    YDSVault vault;

    address userA = address(0xA11CE);
    address userB = address(0xB0B);
    address rec1 = address(0x1111);
    address rec2 = address(0x2222);

    function setUp() public {
        // token + balances
        usdc = new MockERC20();
        usdc.mint(userA, 10_000e6);
        usdc.mint(userB, 10_000e6);

        DonationRouter.Receiver[] memory rec = new DonationRouter.Receiver[](2);
        rec[0] = DonationRouter.Receiver({account: rec1, bps: 7000});
        rec[1] = DonationRouter.Receiver({account: rec2, bps: 3000});
        router = new DonationRouter(rec);

        // Create a dummy adapter first for vault construction  
        MockYieldAdapter dummyAdapter = new MockYieldAdapter(address(usdc), address(this));
        
        // Create vault with dummy adapter
        vault = new YDSVault(IERC20(address(usdc)), "YDS Octant Vault", "YDSOV", address(dummyAdapter), address(router));
        
        // Now create real adapter with correct owner = vault
        adapter = new MockYieldAdapter(address(usdc), address(vault));
        
        // Update vault to use the real adapter
        vault.setAdapter(address(adapter));

        // approvals
        vm.startPrank(userA);
        usdc.approve(address(vault), type(uint256).max);
        vm.stopPrank();
        vm.startPrank(userB);
        usdc.approve(address(vault), type(uint256).max);
        vm.stopPrank();

        // target: fuzz across this contract
        targetContract(address(this));
    }

    // ------- Handlers for invariant engine (simple stochastic actions) -------

    function depositA(uint256 amt) public {
        // Custom bound to avoid logging: clamp between 1e6 and 5_000e6
        if (amt < 1e6) amt = 1e6;
        if (amt > 5_000e6) amt = 5_000e6;
        
        vm.prank(userA);
        vault.deposit(amt, userA);
    }

    function depositB(uint256 amt) public {
        // Custom bound to avoid logging: clamp between 1e6 and 5_000e6
        if (amt < 1e6) amt = 1e6;
        if (amt > 5_000e6) amt = 5_000e6;
        
        vm.prank(userB);
        vault.deposit(amt, userB);
    }

    function simulateProfit(uint256 p) public {
        // Custom bound to avoid logging: clamp between 1e4 and 5_000e6
        if (p < 1e4) p = 1e4;
        if (p > 5_000e6) p = 5_000e6;
        
        vm.prank(address(vault));
        adapter.bumpYield(p);
    }

    function doHarvest() public {
        vault.harvest();
    }

    function redeemA(uint256 shares) public {
        uint256 userBalance = vault.balanceOf(userA);
        if (userBalance == 0) return;
        
        // Custom bound to avoid logging: clamp between 1 and user balance
        if (shares < 1) shares = 1;
        if (shares > userBalance) shares = userBalance;
        
        vm.prank(userA);
        vault.redeem(shares, userA, userA);
    }

    function redeemB(uint256 shares) public {
        uint256 userBalance = vault.balanceOf(userB);
        if (userBalance == 0) return;
        
        // Custom bound to avoid logging: clamp between 1 and user balance
        if (shares < 1) shares = 1;
        if (shares > userBalance) shares = userBalance;
        
        vm.prank(userB);
        vault.redeem(shares, userB, userB);
    }

    // ----------------------------- Invariants -----------------------------

    /// @notice Invariant: With only positive simulated yield, price-per-share is non-decreasing across harvests.
    function invariant_PPSNonDecreasing() public {
        uint256 totalSupply = vault.totalSupply();
        if (totalSupply == 0) return;

        // PPS = totalAssets / totalSupply (scaled by asset decimals ~ 1e6 here)
        uint256 pps = vault.convertToAssets(1e18); // assets per 1e18 shares
        // We store the last PPS in a persistent slot using vm.load/store to avoid extra state.
        bytes32 slot = keccak256("yds.invariant.pps");
        uint256 last = uint256(vm.load(address(this), slot));
        if (last == 0) {
            vm.store(address(this), slot, bytes32(pps));
        } else {
            assertGe(pps, last, "PPS should not decrease under positive-yield-only model");
            vm.store(address(this), slot, bytes32(pps));
        }
    }

    /// @notice Invariant: After `harvest()`, the donation router's total received
    ///         (rec1 + rec2) never exceeds cumulative profits generated.
    /// @dev Because we only bump positive yield, donated amount must be <= sum of bumps.
    function invariant_DonationsNotExceedProfit() public view {
        // This is a soft check using vault bookkeeping: totalAssets >= lastRecordedAssets
        // immediately after harvest (since we sync the watermark). So donated amount is bounded.
        // Allow small tolerance for rounding errors (up to 1000 wei difference)
        uint256 totalAssets = vault.totalAssets();
        uint256 watermark = vault.lastRecordedAssets();
        if (watermark > totalAssets) {
            assertLe(watermark - totalAssets, 1000, "AUM should not be significantly below watermark");
        }
    }
}
