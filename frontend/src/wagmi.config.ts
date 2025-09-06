import { createConfig, configureChains } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryCache } from '@tanstack/react-query'
import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  braveWallet,
} from '@rainbow-me/rainbowkit/wallets'

// API keys
const walletConnectProjectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID

console.log('WalletConnect Project ID:', walletConnectProjectId ? 'Found' : 'Not found')

// Configure chains and providers with Alchemy RPC
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia, mainnet],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        if (chain.id === sepolia.id)
          return { 
            http: 'https://eth-sepolia.g.alchemy.com/v2/Bl5IpQ4M7YdHcMngA1n7k',
            webSocket: 'wss://eth-sepolia.g.alchemy.com/v2/Bl5IpQ4M7YdHcMngA1n7k'
          }
        if (chain.id === mainnet.id)
          return { 
            http: 'https://eth-mainnet.g.alchemy.com/v2/Bl5IpQ4M7YdHcMngA1n7k',
            webSocket: 'wss://eth-mainnet.g.alchemy.com/v2/Bl5IpQ4M7YdHcMngA1n7k'
          }
        return null
      },
    }),
    publicProvider(),
  ],
)

// Create connectors for MetaMask, Coinbase and Brave only
const connectors = connectorsForWallets([
  {
    groupName: 'Popular Wallets',
    wallets: [
      metaMaskWallet({
        projectId: walletConnectProjectId || 'demo-project-id',
        chains,
      }),
      coinbaseWallet({
        appName: 'Web3 Payroll System',
        chains,
      }),
      braveWallet({ chains }),
    ],
  },
])

export const config = createConfig({
  autoConnect: false,
  connectors,
  publicClient,
  webSocketPublicClient,
})

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, 
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('reverse') || error?.message?.includes('Internal error')) 
          return false
        return failureCount < 3
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (error?.message?.includes('reverse') || error?.message?.includes('Internal error')) {
        console.warn('ENS resolution error (ignored):', error.message)
      }
    },
  }),
})

// Contract addresses per chain
export const CONTRACT_ADDRESSES = {
  [mainnet.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_MAINNET || '',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
    baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    ethRegistrarController: '0x253553366Da8546fC250F225fe3d25d0C782303b',
  },
  [sepolia.id]: {
    payrollManager: process.env.REACT_APP_PAYROLL_MANAGER_SEPOLIA || '0x67B96844213890B02D8069358821510222e65444',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
    baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
    ethRegistrarController: '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72',
  },
}

// Token addresses per chain
export const TOKEN_ADDRESSES = {
  [mainnet.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86a33E6e527e1F8A4E84F57FB1e8A84eB8aEd',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
  [sepolia.id]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    USDT: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49',
    DAI: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
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

// Utility functions
export const getCurrentChainAddresses = (chainId: number | string) => {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[sepolia.id]
}

export const getCurrentChainTokens = (chainId: number | string) => {
  return TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES] || TOKEN_ADDRESSES[sepolia.id]
}

export const isSupportedWallet = (walletName: string) => {
  const supported = ['MetaMask', 'Coinbase Wallet', 'Brave Wallet']
  return supported.includes(walletName)
}
