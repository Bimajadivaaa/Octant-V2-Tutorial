# 🌐 Octant V2 Smart Contracts

> **Yield Donation Strategy (YDS) - Solidity Implementation for Public Goods Funding**

This repository contains the smart contracts powering the Octant V2 Tutorial, implementing a **Yield Donation Strategy** that automatically converts DeFi yield into donations for public goods projects. Built with educational purposes in mind, these contracts demonstrate how blockchain technology can create sustainable funding mechanisms for the Ethereum ecosystem.

---

## 🎯 Core Concept

The Octant V2 system implements a revolutionary approach to public goods funding:

1. **💰 Users deposit assets** → Funds go into a yield-generating vault
2. **📈 Capital earns yield** → Assets are invested in DeFi protocols (Aave V3) 
3. **🎁 Yield becomes donations** → Profits are automatically donated to public goods
4. **🔒 Principal stays safe** → Users can withdraw their original deposit anytime

**Key Innovation**: Only the *yield* is donated, never the user's principal investment.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   YDS Vault     │    │  Yield Adapter  │    │ Donation Router │
│   (ERC4626)     │◄──►│   (Aave V3)     │    │   (Splitter)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
   User Deposits           Yield Generation        Public Goods
   Share Tokens           (Interest/Rewards)       Recipients
```

### 📋 Contract Structure

```
src/contracts/
├── YDSStrategy.sol         # 🏛️ Main vault contract (ERC4626)
├── adapters/
│   └── AaveAdapter.sol     # 🔌 Aave V3 yield adapter
└── utils/
    └── DonationRouter.sol  # 🎯 Donation distribution system
```

---

## 📜 Smart Contracts Deep Dive

### 🏛️ YDSVault (`YDSStrategy.sol`)

**The heart of the system** - An ERC4626 vault that:

- **Accepts user deposits** in any ERC20 token (USDC, DAI, etc.)
- **Issues share tokens** representing vault ownership
- **Automatically invests** deposits via yield adapters
- **Tracks profit** using a high-water mark system
- **Donates yield** while preserving user principal

#### 🔑 Key Features:
- **ERC4626 Standard**: Full compatibility with DeFi ecosystem
- **Profit-Only Donations**: User deposits remain untouched
- **Flexible Yield Sources**: Adapter pattern supports multiple protocols
- **Transparent Tracking**: All flows logged for educational clarity

#### 🛠️ Core Functions:
```solidity
function deposit(uint256 assets, address receiver) → uint256 shares
function withdraw(uint256 assets, address receiver, address owner) → uint256 shares  
function harvest() → donates accumulated profit
function totalAssets() → returns vault's total AUM
```

---

### 🔌 AaveAdapter (`adapters/AaveAdapter.sol`)

**Yield generation engine** that:

- **Connects to Aave V3** lending protocol
- **Supplies assets** to earn lending interest
- **Manages aTokens** (Aave interest-bearing tokens)
- **Handles deposits/withdrawals** on behalf of the vault

#### 🔑 Security Features:
- **Owner-only access**: Only the vault can control the adapter
- **Asset validation**: Ensures underlying token consistency
- **Safe transfers**: Uses OpenZeppelin SafeERC20

#### 📊 Yield Mechanism:
```solidity
USDC Deposit → Aave Pool → aUSDC (grows over time) → Profit for donation
```

---

### 🎯 DonationRouter (`utils/DonationRouter.sol`)

**Profit distribution system** that:

- **Splits donations** among multiple recipients
- **Uses basis points** for precise allocation (1 bps = 0.01%)
- **Ensures fair distribution** with mathematical precision
- **Supports flexible configurations** for different funding models

#### 💡 Example Configuration:
```solidity
// 70% to Protocol Development, 30% to Education
Receiver[] = [
    {account: protocolDao, bps: 7000},
    {account: educationFund, bps: 3000}
]
```

---

## 🚀 Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/) - Fast, portable Ethereum development toolkit
- [Git](https://git-scm.com/) - Version control
- [Node.js](https://nodejs.org/) (optional) - For frontend integration

### Installation

```bash
# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test

# Run with detailed logs
forge test -vv
```

### 🧪 Testing

The repository includes comprehensive test suites:

```bash
# Unit tests - Individual contract functionality
forge test --match-path "test/YDS.unit.t.sol" -vv

# Invariant tests - System-wide properties
forge test --match-path "test/YDS.invariant.t.sol" -vv

# Gas optimization reports
forge snapshot
```

---

## 📊 Contract Interactions

### 🔄 Deposit Flow
```solidity
1. User calls vault.deposit(1000 USDC, userAddress)
2. Vault mints shares to user
3. Vault transfers USDC to AaveAdapter  
4. Adapter supplies USDC to Aave V3
5. User receives vault shares representing ownership
```

### 📈 Harvest & Donation Flow
```solidity
1. Anyone calls vault.harvest()
2. Vault calculates profit vs. watermark
3. Adapter withdraws profit from Aave
4. DonationRouter splits profit to recipients
5. Watermark updated to new total
```

### 💸 Withdrawal Flow
```solidity
1. User calls vault.withdraw(500 USDC, userAddress, userAddress)
2. Adapter pulls liquidity from Aave
3. Vault burns user's shares
4. USDC transferred to user
5. System rebalances
```

---

## 🔧 Configuration & Deployment

### Local Development

```bash
# Start local blockchain
anvil

# Deploy to local network
forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8545 --broadcast

# Demo donation flow
forge script script/DemoDonate.s.sol:DemoDonate --rpc-url http://localhost:8545 --broadcast
```

### Mainnet Deployment

```bash
# Deploy to mainnet (configure .env first)
forge script script/Deploy.s.sol:Deploy --rpc-url $MAINNET_RPC_URL --broadcast --verify
```

---

## 🛡️ Security Considerations

### ⚠️ Important Notes

This implementation is designed for **educational purposes**. Production deployments should consider:

- **Access Controls**: Multi-sig governance for critical functions
- **Loss Handling**: Sophisticated mechanisms for yield losses
- **Oracle Integration**: Price feeds for accurate accounting  
- **Emergency Stops**: Circuit breakers for emergency situations
- **Formal Verification**: Mathematical proofs of correctness
- **External Audits**: Professional security reviews

### 🔒 Current Protections

- **Owner-only adapters**: Prevent unauthorized access
- **Asset validation**: Ensure token consistency
- **Safe transfers**: Prevent common token vulnerabilities
- **Watermark tracking**: Accurate profit calculation

---

## 📚 Educational Resources

### 🎓 Learning Objectives

This codebase demonstrates:

- **ERC4626 Vault Standards** - Modern DeFi vault patterns
- **Yield Aggregation** - Connecting to external protocols
- **Automated Donations** - Programmable philanthropy  
- **Modular Architecture** - Adapter pattern implementation
- **Testing Strategies** - Unit, integration, and invariant testing

### 📖 Key Concepts

- **High-Water Mark**: Tracking profit without double-counting
- **Yield Adapters**: Abstracting underlying protocols
- **Share Token Mechanics**: ERC4626 deposit/withdrawal accounting
- **Basis Points Math**: Precise percentage calculations

---

## 🤝 Contributing

We welcome contributions! Areas for improvement:

- **New yield adapters** (Compound, Yearn, Lido)
- **Gas optimizations**  
- **Additional test coverage**
- **Documentation improvements**
- **Security enhancements**

### Development Workflow

```bash
# Fork the repository
git fork

# Create feature branch  
git checkout -b feature/new-adapter

# Make changes and test
forge test

# Submit pull request
git push origin feature/new-adapter
```

---

## 🛠️ Foundry Commands Reference

### Build & Compilation
```bash
forge build              # Compile contracts
forge clean              # Clean build artifacts
forge inspect Contract   # View contract details
```

### Testing & Verification
```bash
forge test                    # Run all tests
forge test -vv               # Verbose output  
forge test --gas-report      # Gas usage report
forge coverage               # Code coverage analysis
```

### Deployment & Interaction
```bash
forge create Contract                    # Deploy contract
cast call <address> "function()"       # Read contract state
cast send <address> "function()" --value 1ether  # Send transaction
```

### Development Tools
```bash
anvil                    # Local test network
forge fmt                # Format code
forge snapshot           # Gas benchmarks  
cast --help             # Comprehensive CLI help
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 🌟 Acknowledgments

Built with ❤️ for the Ethereum ecosystem and public goods funding innovation.

- **OpenZeppelin**: Secure smart contract libraries
- **Foundry**: Modern development toolkit
- **Aave**: Decentralized lending protocol
- **Octant**: Public goods funding platform

---

**Ready to dive into the future of sustainable funding? Start with `forge test -vv` to see the magic happen! ✨**
