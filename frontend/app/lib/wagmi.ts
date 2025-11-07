import { http, createConfig } from 'wagmi'
import { localhost, hardhat } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'
import contractAddresses from './contractAddresses.json'

// Custom localhost chain dengan auto-add ke MetaMask
const localChain = {
  ...localhost,
  name: 'Local Anvil',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Local',
      url: 'http://localhost:8545',
    },
  },
}

// Configuration for local blockchain (Anvil/Hardhat)
export const config = createConfig({
  chains: [localChain, hardhat],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [localChain.id]: http('http://127.0.0.1:8545'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
})

// Contract addresses for localhost
export const CONTRACTS = {
  USDC_MOCK: contractAddresses.localhost.USDC_MOCK as `0x${string}`,
  YDS_VAULT: contractAddresses.localhost.YDS_VAULT as `0x${string}`,
  DONATION_ROUTER: contractAddresses.localhost.DONATION_ROUTER as `0x${string}`,
  AAVE_ADAPTER: contractAddresses.localhost.AAVE_ADAPTER as `0x${string}`,
}

// Local blockchain configuration
export const LOCAL_CHAIN_CONFIG = {
  chainId: 31337, // Anvil/Hardhat default
  rpcUrl: 'http://127.0.0.1:8545',
  blockExplorer: 'http://localhost:8545', // No block explorer for local
}