/**
 * Contract constants and configurations for Web3 Payroll System
 * @author Dev Austin
 */

// Contract ABIs
import PayrollManagerABI from './abis/PayrollManager.json'

// Network configurations
export const NETWORKS = {
  MAINNET: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://etherscan.io',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6Cb31c09Ba78EBaBa41',
  },
  SEPOLIA: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    blockExplorer: 'https://sepolia.etherscan.io',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6Cb31c09Ba78EBaBa41',
  },
  GOERLI: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/demo',
    blockExplorer: 'https://goerli.etherscan.io',
    ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    publicResolver: '0x4976fb03C32e5B8cfe2b6Cb31c09Ba78EBaBa41',
  },
  LOCALHOST: {
    chainId: 31337,
    name: 'Localhost Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545', // Local blockchain explorer (if any)
    ensRegistry: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Mock for local testing
    publicResolver: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', // Mock for local testing
  },
} as const

// Token addresses by network
export const TOKEN_ADDRESSES = {
  [NETWORKS.MAINNET.chainId]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xA0b86a33E6e527e1F8A4E84F57FB1e8A84eB8aEd',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
  [NETWORKS.SEPOLIA.chainId]: {
    ETH: '0x0000000000000000000000000000000000000000',
    // Test tokens on Sepolia (if available)
    USDC: '0x0000000000000000000000000000000000000000',
    USDT: '0x0000000000000000000000000000000000000000',
    DAI: '0x0000000000000000000000000000000000000000',
  },
  [NETWORKS.GOERLI.chainId]: {
    ETH: '0x0000000000000000000000000000000000000000',
    // Test tokens on Goerli (if available)
    USDC: '0x0000000000000000000000000000000000000000',
    USDT: '0x0000000000000000000000000000000000000000',
    DAI: '0x0000000000000000000000000000000000000000',
  },
  // Local Hardhat network tokens (using ETH for testing)
  [31337]: {
    ETH: '0x0000000000000000000000000000000000000000',
    // For local testing, we'll primarily use ETH
    USDC: '0x0000000000000000000000000000000000000000',
    USDT: '0x0000000000000000000000000000000000000000',
    DAI: '0x0000000000000000000000000000000000000000',
  },
} as const

// Contract addresses by network (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  [NETWORKS.MAINNET.chainId]: {
    PayrollManager: process.env.REACT_APP_PAYROLL_MANAGER_MAINNET || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  [NETWORKS.SEPOLIA.chainId]: {
    PayrollManager: process.env.REACT_APP_PAYROLL_MANAGER_SEPOLIA || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  [NETWORKS.GOERLI.chainId]: {
    PayrollManager: process.env.REACT_APP_PAYROLL_MANAGER_GOERLI || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
  // Add local hardhat network for testing
  31337: {
    PayrollManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  },
} as const

// Payment frequency enum values
export const PAYMENT_FREQUENCIES = {
  WEEKLY: 0,
  BIWEEKLY: 1,
  MONTHLY: 2,
  QUARTERLY: 3,
} as const

// Payment frequency labels
export const PAYMENT_FREQUENCY_LABELS = {
  [PAYMENT_FREQUENCIES.WEEKLY]: 'Weekly',
  [PAYMENT_FREQUENCIES.BIWEEKLY]: 'Bi-weekly',
  [PAYMENT_FREQUENCIES.MONTHLY]: 'Monthly',
  [PAYMENT_FREQUENCIES.QUARTERLY]: 'Quarterly',
} as const

// Token information
export const TOKEN_INFO = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logo: '/tokens/eth.png',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: '/tokens/usdc.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: '/tokens/usdt.png',
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logo: '/tokens/dai.png',
  },
} as const

// Contract ABIs
export const CONTRACT_ABIS = {
  PayrollManager: PayrollManagerABI,
} as const

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  EMPLOYEES: '/employees',
  PAYROLL: '/payroll',
  BONUSES: '/bonuses',
  ENS: '/ens',
  ANALYTICS: '/analytics',
  AUTH: '/auth',
} as const

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WRONG_NETWORK: 'Please switch to the correct network',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  CONTRACT_NOT_DEPLOYED: 'Contract not deployed on this network',
  EMPLOYEE_NOT_FOUND: 'Employee not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_ADDRESS: 'Invalid wallet address',
  ENS_DOMAIN_TAKEN: 'ENS domain is already taken',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  EMPLOYEE_ADDED: 'Employee added successfully',
  PAYROLL_PROCESSED: 'Payroll processed successfully',
  BONUS_DISTRIBUTED: 'Bonus distributed successfully',
  ENS_DOMAIN_REGISTERED: 'ENS domain registered successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
} as const

// Loading messages
export const LOADING_MESSAGES = {
  CONNECTING_WALLET: 'Connecting wallet...',
  PROCESSING_TRANSACTION: 'Processing transaction...',
  LOADING_DATA: 'Loading data...',
  REGISTERING_DOMAIN: 'Registering ENS domain...',
  PROCESSING_PAYROLL: 'Processing payroll...',
  DISTRIBUTING_BONUS: 'Distributing bonus...',
} as const

// Default values
export const DEFAULTS = {
  GAS_LIMIT: 500000,
  GAS_PRICE: '20000000000', // 20 gwei
  PAYMENT_FREQUENCY: PAYMENT_FREQUENCIES.MONTHLY,
  PREFERRED_TOKEN: TOKEN_ADDRESSES[NETWORKS.MAINNET.chainId].ETH,
  PAGE_SIZE: 10,
  REFRESH_INTERVAL: 30000, // 30 seconds
} as const

// Validation rules
export const VALIDATION = {
  MIN_SALARY: 0.001, // 0.001 ETH minimum
  MAX_SALARY: 1000, // 1000 ETH maximum
  ENS_SUBDOMAIN_MIN_LENGTH: 3,
  ENS_SUBDOMAIN_MAX_LENGTH: 63,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
} as const

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#4caf50',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  WALLET_CONNECTED: 'wallet_connected',
  SELECTED_NETWORK: 'selected_network',
  USER_PREFERENCES: 'user_preferences',
  CONTRACT_ADDRESSES: 'contract_addresses',
} as const
