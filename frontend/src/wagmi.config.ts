import { createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { mainnet, sepolia, goerli } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  braveWallet,
} from '@rainbow-me/rainbowkit/wallets'

// Define local hardhat chain for testing
const hardhat = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
} as const

/**
 * Wagmi configuration for Web3 Payroll System - MetaMask, Coinbase & Brave Only
 * @author Dev Austin
 */

// Get WalletConnect project ID from environment
const walletConnectProjectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID

// Log the project ID for debugging (remove in production)
console.log('WalletConnect Project ID:', walletConnectProjectId ? 'Found' : 'Not found')

// Configure chains and providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, mainnet, goerli, hardhat],
  [
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY || '' }),
    publicProvider()
  ]
)

// Create connectors for ONLY MetaMask, Coinbase, and Brave
const connectors = connectorsForWallets([
  {
    groupName: 'Popular Wallets',
    wallets: [
      metaMaskWallet({ 
        projectId: walletConnectProjectId || 'demo-project-id',
        chains
      }),
      coinbaseWallet({
        appName: 'Web3 Payroll System',
        chains
      }),
      braveWallet({
        chains
      }),
    ],
  }
])

// Create wagmi config 
export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient
})

// Create query client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
})

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  [hardhat.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_HARDHAT || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    ethRegistrarController: '0x253553366Da8546fC250F225fe3d25d0C782303b',
  },
  [mainnet.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_MAINNET || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    ethRegistrarController: '0x253553366Da8546fC250F225fe3d25d0C782303b',
  },
  [sepolia.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_SEPOLIA || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD', // Sepolia resolver
    baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    ethRegistrarController: '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72', // Sepolia controller
  },
  [goerli.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_GOERLI || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    ethRegistrarController: '0x253553366Da8546fC250F225fe3d25d0C782303b',
  },
} as const

// Token addresses
export const TOKEN_ADDRESSES = {
  [hardhat.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0000000000000000000000000000000000000000', // Mock addresses for local testing
    USDT: '0x0000000000000000000000000000000000000000',
    DAI: '0x0000000000000000000000000000000000000000',
  },
  [mainnet.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86a33E6e527e1F8A4E84F57FB1e8A84eB8aEd',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
  [sepolia.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Sepolia USDC
    USDT: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49', // Sepolia USDT
    DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', // Sepolia DAI
  },
  [goerli.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0000000000000000000000000000000000000000', // No USDC on Goerli
    USDT: '0x0000000000000000000000000000000000000000', // No USDT on Goerli
    DAI: '0x0000000000000000000000000000000000000000', // No DAI on Goerli
  },
} as const

// Payment frequency options
export const PAYMENT_FREQUENCIES = [
  { value: 0, label: 'Weekly', days: 7 },
  { value: 1, label: 'Bi-weekly', days: 14 },
  { value: 2, label: 'Monthly', days: 30 },
  { value: 3, label: 'Quarterly', days: 90 },
] as const

// Token options for UI
export const TOKEN_OPTIONS = [
  { value: '0x0000000000000000000000000000000000000000', label: 'ETH', symbol: 'ETH', decimals: 18 },
  { value: '0xA0b86a33E6e527e1F8A4E84F57FB1e8A84eB8aEd', label: 'USDC', symbol: 'USDC', decimals: 6 },
  { value: '0xdAC17F958D2ee523a2206206994597C13D831ec7', label: 'USDT', symbol: 'USDT', decimals: 6 },
  { value: '0x6B175474E89094C44Da98b954EedeAC495271d0F', label: 'DAI', symbol: 'DAI', decimals: 18 },
] as const

// Utility function to get current chain's contract addresses
export const getCurrentChainAddresses = (chainId: string | number) => {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[sepolia.id]
}

// Utility function to get current chain's token addresses  
export const getCurrentChainTokens = (chainId: string | number) => {
  return TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES] || TOKEN_ADDRESSES[sepolia.id]
}

// Check if wallet is supported
export const isSupportedWallet = (walletName: string) => {
  const supported = ['MetaMask', 'Coinbase Wallet', 'Brave Wallet']
  return supported.includes(walletName)
}