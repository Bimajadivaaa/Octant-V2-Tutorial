// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC20} from "@openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {YDSVault} from "../src/contracts/YDSStrategy.sol";
import {DonationRouter} from "../src/contracts/utils/DonationRouter.sol";

/// @title MockERC20 - Simple USDC mock for local testing
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "mUSDC") {
        // Mint 1M USDC to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**6);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6; // USDC has 6 decimals
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @title MockYieldAdapter - Simple yield adapter for local testing
contract MockYieldAdapter {
    IERC20 public immutable UNDERLYING;
    address public immutable OWNER;
    uint256 internal _assets;
    
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
        console2.log("MockAdapter: Deposited", amount, "USDC");
    }
    
    function withdraw(uint256 amount) external onlyOwner returns (uint256) {
        if (amount > _assets) amount = _assets;
        _assets -= amount;
        require(UNDERLYING.transfer(OWNER, amount), "Transfer failed");
        console2.log("MockAdapter: Withdrew", amount, "USDC");
        return amount;
    }
    
    function totalAssets() external view returns (uint256) {
        return _assets;
    }
    
    function asset() external view returns (address) {
        return address(UNDERLYING);
    }
    
    /// @notice Simulate yield generation for demo purposes
    function simulateYield(uint256 yieldAmount) external {
        // Mint yield to this contract
        MockUSDC(address(UNDERLYING)).mint(address(this), yieldAmount);
        _assets += yieldAmount;
        console2.log("MockAdapter: Generated", yieldAmount, "USDC yield");
    }
}

/// @title DeployLocal - Deploy all contracts for local testing
contract DeployLocal is Script {
    function run() external {
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        
        vm.startBroadcast(pk);
        
        address deployer = vm.addr(pk);
        console2.log("Deploying with account:", deployer);
        
        // 1) Deploy MockUSDC
        MockUSDC usdc = new MockUSDC();
        console2.log("MockUSDC deployed at:", address(usdc));
        console2.log("Deployer USDC balance:", usdc.balanceOf(deployer));
        
        // 2) Setup donation recipients (using some Anvil accounts)
        address recipient1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil account #1
        address recipient2 = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil account #2
        
        DonationRouter.Receiver[] memory recipients = new DonationRouter.Receiver[](2);
        recipients[0] = DonationRouter.Receiver({account: recipient1, bps: 7000}); // 70%
        recipients[1] = DonationRouter.Receiver({account: recipient2, bps: 3000}); // 30%
        
        // 3) Deploy DonationRouter
        DonationRouter router = new DonationRouter(recipients);
        console2.log("DonationRouter deployed at:", address(router));
        
        // 4) Deploy YDS Vault with temporary adapter
        MockYieldAdapter tempAdapter = new MockYieldAdapter(address(usdc), deployer);
        
        YDSVault vault = new YDSVault(
            IERC20(address(usdc)),
            "YDS Octant Vault",
            "YDSOV", 
            address(tempAdapter),
            address(router)
        );
        console2.log("YDSVault deployed at:", address(vault));
        
        // 5) Deploy final adapter with vault as owner
        MockYieldAdapter adapter = new MockYieldAdapter(address(usdc), address(vault));
        console2.log("MockYieldAdapter deployed at:", address(adapter));
        
        // 6) Update vault to use correct adapter
        vault.setAdapter(address(adapter));
        console2.log("Vault adapter updated to:", address(adapter));
        
        // 7) Mint some extra USDC for testing to other accounts
        address testUser = 0x90F79bf6EB2c4f870365E785982E1f101E93b906; // Anvil account #3
        usdc.mint(testUser, 10_000 * 10**6); // 10k USDC
        console2.log("Minted 10k USDC to test user:", testUser);
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console2.log("\n=== DEPLOYMENT SUMMARY ===");
        console2.log("MockUSDC        :", address(usdc));
        console2.log("YDSVault        :", address(vault));
        console2.log("MockYieldAdapter:", address(adapter));
        console2.log("DonationRouter  :", address(router));
        console2.log("Recipient 1 (70%):", recipient1);
        console2.log("Recipient 2 (30%):", recipient2);
        console2.log("Test User       :", testUser);
        
        console2.log("=== READY FOR TESTING ===");
    }
}