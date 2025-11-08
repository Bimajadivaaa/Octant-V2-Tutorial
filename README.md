# 🌿 Octant V2 Tutorial - Yield Donating Strategy Vault

<div align="center">
<img width="1920" height="1080" alt="thumbnail-octant-reduce" src="https://github.com/user-attachments/assets/b5a6ae64-899a-4687-b99f-0f9775398662" />
</div>

---
This repository demonstrates how to build a **Yield-Donating Strategy (YDS)** using **Octant V2**.  
The goal is to show how DeFi yield can automatically fund public goods — without reducing user principal.

It includes:
- 🧩 Solidity smart contracts (Vault, Adapter, Donation Router).
- ⚙️ Foundry scripts for testing and deployment.
- 💻 A simple frontend for live demo and interaction.

---

## 📦 Prerequisites

Before starting, make sure you have these installed:

- [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`)
- [Node.js](https://nodejs.org/) v18 or higher
- `pnpm` or `npm`
- MetaMask (or any EVM-compatible wallet)

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Bimajadivaaa/Octant-V2-Tutorial
cd Octant-V2-Tutorial/contracts
````

---

### 2️⃣ Run Tests

Use Foundry to verify contracts and see the simulation.

```bash
forge test --match-contract YDSUnitTest -vvv
```

This will test:

* Yield-Donating Vault (YDSVault)
* Mock Yield Adapter
* Donation Router logic

---

### 3️⃣ Start a Local Blockchain

Run **Anvil** to create a local test network:

```bash
anvil --host 0.0.0.0 --chain-id 31337
```

This will start a local EVM node with 10 funded accounts.
Each account has a private key — copy one for deployment later.

---

### 4️⃣ Deploy Contracts Locally

Deploy all smart contracts on your local chain.

```bash
forge script script/DeployLocal.s.sol:DeployLocal \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <PRIVATE_KEY> \
  --broadcast
```

This deploys:

* `Mock USDC`
* `MockYieldAdapter`
* `YDSVault`
* `DonationRouter`

After success, Foundry will print deployed contract addresses.

---

### 5️⃣ Configure Frontend Contract Addresses

Go to the frontend configuration file:

```
frontend/app/lib/contractAddresses.json
```

Paste the new addresses printed from your deployment:

```json
{
  "USDC_MOCK": "<USDC_CONTRACT_ADDRESS>",
  "YDS_VAULT": "<YDS_VAULT_CONTRACT_ADDRESS",
  "MOCK_YIELD_ADAPTER": "<MOCK_YIELD_ADAPTER_CONTRACT_ADDRESS>",
  "DONATION_ROUTER": "<DONATION_ROUTER_CONTRACT_ADDRESS>"
}
```

---

### 6️⃣ Install Frontend Dependencies

```bash
cd ../frontend
pnpm install
# or
npm install
```

---

### 7️⃣ Run the Frontend

Start the development server:

```bash
pnpm run dev
# or
npm run dev
```

Open your browser at
👉 [http://localhost:3000](http://localhost:3000)

You’ll see a dashboard where you can deposit, withdraw, and harvest donations.

---

### 8️⃣ Import Anvil Account to MetaMask

1. Copy one of the private keys from the Anvil terminal.
2. Open MetaMask → **Import Account** → paste the key.
3. Switch to **Localhost 31337** network.

---

### 9️⃣ Connect & Enjoy 🎉

* Connect your wallet in the frontend
* Deposit mock USDC into the vault
* Trigger **Harvest** to donate simulated yield
* Watch funds automatically split between recipients

---

## 🧠 Concept Overview

In **Octant V2**, a **Funding Vault** is a smart contract that lets users deposit tokens safely.
It invests the capital through a yield source and donates only the generated profit.

This example implements a simplified **Yield-Donating Strategy (YDS)**:

* Users deposit tokens into the vault
* The vault invests through a **Yield Adapter**
* When profit is detected, it’s sent to a **Donation Router**
* The router automatically distributes yield to recipient addresses

The result:
💸 Your money stays intact, and only the yield funds public impact.

---

## 🧰 Tech Stack

| Layer           | Tool / Framework              | Description                                |
| --------------- | ----------------------------- | ------------------------------------------ |
| Smart Contracts | Solidity + Foundry            | Core logic for vault, adapter, and router  |
| Frontend        | Next.js 14 + Tailwind + Wagmi | Connect wallet and interact with the vault |
| Blockchain      | Anvil (Local EVM)             | Local testing environment                  |
| Package Manager | pnpm / npm                    | Frontend dependency management             |

---

## 🧪 Common Commands

| Command                        | Description              |
| ------------------------------ | ------------------------ |
| `forge build`                  | Compile all contracts    |
| `forge test -vvv`              | Run full test suite      |
| `anvil`                        | Start local testnet      |
| `forge script ... --broadcast` | Deploy contracts         |
| `pnpm run dev`                 | Run the frontend locally |

---

## 📜 License

MIT © 2025 [Bimajadivaaa](https://github.com/Bimajadivaaa)

---

## 🌐 Links

* 📘 **Docs:** [https://docs.v2.octant.build](https://docs.v2.octant.build)
* 🎥 **Tutorial Video:** [Youtube](https://youtu.be/xkVgl2yoq-g)
* ✨ **Medium Blog:** [Medium](https://medium.com/@bimajdv7/how-i-built-a-self-perpetuating-donation-engine-that-never-touches-your-principal-834a86512ea8)

---

> This project is part of the **Octant V2 Hackathon**, demonstrating how on-chain yield can fund public goods transparently through a yield-donating vault.
