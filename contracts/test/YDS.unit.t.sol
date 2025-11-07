// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
// import {console2} from "forge-std/console2.sol";
import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {YDSVault} from "../src/contracts/YDSStrategy.sol";
import {DonationRouter} from "../src/contracts/utils/DonationRouter.sol";

/// -----------------------------
/// Mocks for unit testing
/// -----------------------------

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {}
    function mint(address to, uint256 amt) external { _mint(to, amt); }
}

interface IAdapterViewLike {
    function totalAssets() external view returns (uint256);
    function asset() external view returns (address);
}

/// @notice Simple adapter that holds the underlying and can "grow" its balance.
contract MockYieldAdapter is IAdapterViewLike {
    IERC20 public immutable UNDERLYING;
    address public immutable OWNER;
    uint256 internal _assets; // simulated AUM

    error NotOwner();

    constructor(address _underlying, address _owner) {
        UNDERLYING = IERC20(_underlying);
        OWNER = _owner;
    }

    modifier onlyOwner() {
        if (msg.sender != OWNER) revert NotOwner();
        _;
    }

    function deposit(uint256 amount) external onlyOwner {
        require(UNDERLYING.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        _assets += amount;
    }

    function withdraw(uint256 amount) external onlyOwner returns (uint256) {
        if (amount > _assets) amount = _assets;
        _assets -= amount;
        require(UNDERLYING.transfer(OWNER, amount), "Transfer failed");
        return amount;
    }

    function totalAssets() external view returns (uint256) { return _assets; }
    function asset() external view returns (address) { return address(UNDERLYING); }

    /// @notice Simulate yield: increase internal accounting and mint tokens to simulate yield.
    function bumpYield(uint256 profit) external onlyOwner {
        _assets += profit;
        // Mint the profit to this adapter to simulate yield generation
        MockERC20(address(UNDERLYING)).mint(address(this), profit);
    }
}

contract YDSUnitTest is Test {
    MockERC20 usdc;
    DonationRouter router;
    MockYieldAdapter adapter;
    YDSVault vault;

    address user = address(0xBEEF);
    address rec1 = address(0x1111);
    address rec2 = address(0x2222);

    function setUp() public {
        // Token + mint balances
        usdc = new MockERC20();
        usdc.mint(user, 5_000e6);

        // Donation router 70/30
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

        // Approvals
        vm.startPrank(user);
        IERC20(address(usdc)).approve(address(vault), type(uint256).max);
        vm.stopPrank();
    }

    function test_Deposit_Harvest_DonatesProfit() public {
        // User deposits 1,000
        vm.startPrank(user);
        vault.deposit(1_000e6, user);
        vm.stopPrank();

        // Simulate +100 profit inside adapter  
        vm.prank(address(vault));
        adapter.bumpYield(100e6);

        // Harvest should donate 100 split 70/30
        uint256 bal1Before = usdc.balanceOf(rec1);
        uint256 bal2Before = usdc.balanceOf(rec2);

        vault.harvest();
        
        uint256 donated1 = usdc.balanceOf(rec1) - bal1Before;
        uint256 donated2 = usdc.balanceOf(rec2) - bal2Before;

        assertEq(donated1, 70e6, "rec1 should get 70%");
        assertEq(donated2, 30e6, "rec2 should get 30%");
    }

    function test_Withdraw_AfterHarvest_UserGetsSharesValue() public {
        vm.startPrank(user);
        vault.deposit(2_000e6, user);
        vm.stopPrank();

        vm.prank(address(vault));
        adapter.bumpYield(200e6); // +200 profit

        vault.harvest(); // donate 200

        // User should still be able to withdraw principal (shares map to principal)
        uint256 shares = vault.balanceOf(user);
        uint256 assetsOut = vault.previewRedeem(shares);
        // Since profit got donated, PPS ~= 1.0 in this MVP
        assertApproxEqAbs(assetsOut, 2_000e6, 1, "principal should be intact");
    }
}
