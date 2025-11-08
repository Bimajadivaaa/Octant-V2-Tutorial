# Octant V2 Frontend

> Yield-Driven Staking for Public Goods Funding - Frontend Interface

## Overview

The Octant V2 Frontend is a modern web application built with Next.js that provides an intuitive interface for interacting with the Octant V2 protocol. This application enables users to deposit USDC, earn yield through DeFi protocols, and automatically donate generated yield to public goods while keeping their principal safe.

## Features

- 🔗 **Wallet Integration**: Connect with Web3 wallets using Wagmi
- 💰 **USDC Minting**: Test token generation for demo purposes
- 🏦 **Vault Operations**: Deposit and withdraw funds from yield-generating vaults
- 🌾 **Yield Harvesting**: Automatically harvest and donate yield to public goods
- 📊 **Real-time Stats**: Track vault performance and donation metrics
- 🌐 **Network Management**: Automatic network switching and validation
- ⚡ **Anvil Integration**: Local blockchain development support

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi v2 + Viem
- **State Management**: TanStack React Query
- **Blockchain**: Ethereum-compatible networks

## Prerequisites

- Node.js 18+ 
- pnpm, npm, or yarn
- MetaMask or compatible Web3 wallet
- Local Anvil node (for development)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd frontend

# Install dependencies
pnpm install
# or
npm install
```

## Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Add your environment variables here
NEXT_PUBLIC_ANVIL_RPC_URL=http://127.0.0.1:8545
```

## Development

```bash
# Start the development server
pnpm dev
# or
npm run dev

# Build for production
pnpm build
# or
npm run build

# Start production server
pnpm start
# or
npm run start

# Run linting
pnpm lint
# or
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
frontend/
├── app/
│   ├── components/          # Reusable UI components
│   │   ├── DepositSection.tsx
│   │   ├── WithdrawSection.tsx
│   │   ├── HarvestSection.tsx
│   │   ├── VaultStats.tsx
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useVaultContract.ts
│   │   ├── useDonationData.ts
│   │   └── ...
│   ├── lib/               # Utilities and configurations
│   │   ├── abis.ts
│   │   ├── contractAddresses.json
│   │   └── wagmi.ts
│   ├── providers/         # Context providers
│   │   └── Web3Provider.tsx
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Home page
├── public/               # Static assets
├── package.json
└── README.md
```

## Key Components

### Core Functionality
- **VaultStats**: Displays vault performance metrics
- **DonationStats**: Shows total donations and impact
- **DepositSection**: Handle USDC deposits to vault
- **WithdrawSection**: Withdraw funds from vault
- **HarvestSection**: Harvest yield and donate to public goods
- **MintUSDC**: Mint test USDC tokens

### Infrastructure
- **WalletConnect**: Web3 wallet connection interface
- **NetworkChecker**: Validates network configuration
- **AnvilStatus**: Local blockchain connection status

## How It Works

1. **MINT USDC**: Generate test USDC tokens for demonstration
2. **DEPOSIT**: Deposit USDC to receive vault shares that earn yield via Aave
3. **YIELD GENERATION**: Deposited funds automatically earn yield through DeFi protocols
4. **HARVEST & DONATE**: Generated yield is harvested and donated to public goods while preserving principal

## Development Notes

- The application is configured for local development with Anvil
- Contract addresses are defined in `app/lib/contractAddresses.json`
- ABI definitions are centralized in `app/lib/abis.ts`
- Wagmi configuration handles Web3 connectivity

## Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for type safety
3. Test functionality with local Anvil node
4. Ensure all components are responsive
5. Run linting before submitting changes

## License

[Add your license information here]

## Support

For questions and support, please refer to the project documentation or open an issue in the repository.

---

**Built for Octant V2 Tutorial • Hackathon Demo • Local Blockchain Development**