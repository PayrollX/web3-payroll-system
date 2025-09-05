import { createConfig } from 'wagmi'
import { http, createPublicClient } from 'viem'
import { mainnet, sepolia, goerli } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
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
}

/**
 * Wagmi configuration for Web3 Payroll System
 * @author Dev Austin
 */

// Get WalletConnect project ID from environment
const walletConnectProjectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID

// Log the project ID for debugging (remove in production)
console.log('WalletConnect Project ID:', walletConnectProjectId ? 'Found' : 'Not found')

// Create wallet list - include WalletConnect if we have a valid project ID
const createWalletList = () => {
  const baseWallets = [
    injectedWallet({ chains: [hardhat, mainnet, sepolia, goerli] }),
    metaMaskWallet({ 
      projectId: walletConnectProjectId || 'demo-project-id',
      chains: [hardhat, mainnet, sepolia, goerli] 
    }),
    // Removed coinbaseWallet to eliminate websocket errors in development
  ]

  // Add WalletConnect if we have a valid project ID
  if (walletConnectProjectId && 
      walletConnectProjectId !== 'your_project_id' && 
      walletConnectProjectId !== 'your_walletconnect_project_id_here' &&
      walletConnectProjectId.length > 10) {
    console.log('Adding WalletConnect with project ID')
    baseWallets.push(
      walletConnectWallet({ 
        projectId: walletConnectProjectId,
        chains: [mainnet, sepolia, goerli] 
      })
    )
  } else {
    console.log('Skipping WalletConnect - invalid or missing project ID')
  }

  return baseWallets
}

// Create connectors for supported wallets
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: createWalletList(),
  },
])

// Create wagmi config
export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient: createPublicClient({
    chain: hardhat, // Use hardhat for development
    transport: http('http://127.0.0.1:8545'),
  }),
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
  },
  [mainnet.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_MAINNET || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  },
  [sepolia.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_SEPOLIA || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  },
  [goerli.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_GOERLI || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
  },
}

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
    USDC: '0x0000000000000000000000000000000000000000', // No USDC on Sepolia
    USDT: '0x0000000000000000000000000000000000000000', // No USDT on Sepolia
    DAI: '0x0000000000000000000000000000000000000000', // No DAI on Sepolia
  },
  [goerli.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x0000000000000000000000000000000000000000', // No USDC on Goerli
    USDT: '0x0000000000000000000000000000000000000000', // No USDT on Goerli
    DAI: '0x0000000000000000000000000000000000000000', // No DAI on Goerli
  },
}

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
