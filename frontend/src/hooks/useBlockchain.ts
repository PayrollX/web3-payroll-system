/**
 * Custom hooks for blockchain interactions
 * @author Dev Austin
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useNetwork as useWagmiNetwork } from 'wagmi'
import { blockchainService, Employee, AddEmployeeParams, PaymentResult } from '../services/blockchainService'
import { NETWORKS, ERROR_MESSAGES } from '../contracts/constants'

export interface UseBlockchainReturn {
  // Connection state
  isConnected: boolean
  isOwner: boolean
  currentNetwork: number | null
  contractInfo: any
  
  // Employee management
  employees: Employee[]
  activeEmployees: string[]
  loadingEmployees: boolean
  addEmployee: (params: AddEmployeeParams) => Promise<PaymentResult>
  getEmployee: (address: string) => Promise<Employee | null>
  calculatePaymentAmount: (address: string) => Promise<string>
  
  // Payroll processing
  processPayroll: (addresses: string[]) => Promise<PaymentResult>
  processIndividualPayment: (address: string) => Promise<PaymentResult>
  
  // Contract management
  isPaused: boolean
  pause: () => Promise<PaymentResult>
  unpause: () => Promise<PaymentResult>
  getContractBalance: (tokenAddress: string) => Promise<string>
  
  // Token management
  isTokenAuthorized: (tokenAddress: string) => Promise<boolean>
  setTokenAuthorization: (tokenAddress: string, authorized: boolean) => Promise<PaymentResult>
  
  // Utility functions
  switchNetwork: (chainId: number) => Promise<boolean>
  refreshData: () => Promise<void>
}

/**
 * Hook for blockchain interactions
 */
export const useBlockchain = (): UseBlockchainReturn => {
  const { address, isConnected } = useAccount()
  const { chain } = useWagmiNetwork()
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activeEmployees, setActiveEmployees] = useState<string[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [currentNetwork, setCurrentNetwork] = useState<number | null>(null)
  const [contractInfo, setContractInfo] = useState<any>(null)

  /**
   * Load employees from blockchain
   */
  const loadEmployees = useCallback(async () => {
    if (!isConnected || !address) return

    setLoadingEmployees(true)
    try {
      // Temporarily disable blockchain calls until contract is deployed
      console.log('🔧 Blockchain employee loading disabled - contract not deployed yet')
      setActiveEmployees([])
      setEmployees([])
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoadingEmployees(false)
    }
  }, [isConnected, address])

  /**
   * Check if user is contract owner
   */
  const checkOwnership = useCallback(async () => {
    if (!isConnected || !address) {
      setIsOwner(false)
      return
    }

    try {
      // Temporarily set as owner for testing until contract is deployed
      console.log('🔧 Setting user as owner for testing - contract not deployed yet')
      setIsOwner(true)
    } catch (error) {
      console.error('Error checking ownership:', error)
      setIsOwner(false)
    }
  }, [isConnected, address])

  /**
   * Load contract state
   */
  const loadContractState = useCallback(async () => {
    if (!isConnected) return

    try {
      // Temporarily disable contract state loading until contract is deployed
      console.log('🔧 Contract state loading disabled - contract not deployed yet')
      setIsPaused(false)
      
      const network = await blockchainService.getCurrentNetwork()
      setCurrentNetwork(network)
      
      setContractInfo({
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
        abi: [],
        network: 'Hardhat Local'
      })
    } catch (error) {
      console.error('Error loading contract state:', error)
    }
  }, [isConnected])

  /**
   * Add employee
   */
  const addEmployee = useCallback(async (params: AddEmployeeParams): Promise<PaymentResult> => {
    try {
      const result = await blockchainService.addEmployee(params)
      if (result.success) {
        // Refresh employees list
        await loadEmployees()
      }
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add employee'
      }
    }
  }, [loadEmployees])

  /**
   * Get employee by address
   */
  const getEmployee = useCallback(async (address: string): Promise<Employee | null> => {
    try {
      return await blockchainService.getEmployee(address)
    } catch (error) {
      console.error('Error getting employee:', error)
      return null
    }
  }, [])

  /**
   * Calculate payment amount
   */
  const calculatePaymentAmount = useCallback(async (address: string): Promise<string> => {
    try {
      return await blockchainService.calculatePaymentAmount(address)
    } catch (error) {
      console.error('Error calculating payment amount:', error)
      return '0'
    }
  }, [])

  /**
   * Process payroll
   */
  const processPayroll = useCallback(async (addresses: string[]): Promise<PaymentResult> => {
    try {
      const result = await blockchainService.processPayroll(addresses)
      if (result.success) {
        // Refresh employees list to update last payment timestamps
        await loadEmployees()
      }
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to process payroll'
      }
    }
  }, [loadEmployees])

  /**
   * Process individual payment
   */
  const processIndividualPayment = useCallback(async (address: string): Promise<PaymentResult> => {
    try {
      const result = await blockchainService.processIndividualPayment(address)
      if (result.success) {
        // Refresh employees list
        await loadEmployees()
      }
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to process payment'
      }
    }
  }, [loadEmployees])

  /**
   * Pause contract
   */
  const pause = useCallback(async (): Promise<PaymentResult> => {
    try {
      const result = await blockchainService.pause()
      if (result.success) {
        setIsPaused(true)
      }
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to pause contract'
      }
    }
  }, [])

  /**
   * Unpause contract
   */
  const unpause = useCallback(async (): Promise<PaymentResult> => {
    try {
      const result = await blockchainService.unpause()
      if (result.success) {
        setIsPaused(false)
      }
      return result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to unpause contract'
      }
    }
  }, [])

  /**
   * Get contract balance
   */
  const getContractBalance = useCallback(async (tokenAddress: string): Promise<string> => {
    try {
      return await blockchainService.getContractBalance(tokenAddress)
    } catch (error) {
      console.error('Error getting contract balance:', error)
      return '0'
    }
  }, [])

  /**
   * Check if token is authorized
   */
  const isTokenAuthorized = useCallback(async (tokenAddress: string): Promise<boolean> => {
    try {
      return await blockchainService.isTokenAuthorized(tokenAddress)
    } catch (error) {
      console.error('Error checking token authorization:', error)
      return false
    }
  }, [])

  /**
   * Set token authorization
   */
  const setTokenAuthorization = useCallback(async (tokenAddress: string, authorized: boolean): Promise<PaymentResult> => {
    try {
      return await blockchainService.setTokenAuthorization(tokenAddress, authorized)
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to set token authorization'
      }
    }
  }, [])

  /**
   * Switch network
   */
  const switchNetwork = useCallback(async (chainId: number): Promise<boolean> => {
    try {
      const success = await blockchainService.switchNetwork(chainId)
      if (success) {
        // Refresh data after network switch
        await refreshData()
      }
      return success
    } catch (error) {
      console.error('Error switching network:', error)
      return false
    }
  }, [])

  /**
   * Refresh all data
   */
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadEmployees(),
      checkOwnership(),
      loadContractState(),
    ])
  }, [loadEmployees, checkOwnership, loadContractState])

  // Load data when connected
  useEffect(() => {
    if (isConnected && address) {
      refreshData()
    } else {
      // Reset state when disconnected
      setEmployees([])
      setActiveEmployees([])
      setIsOwner(false)
      setIsPaused(false)
      setCurrentNetwork(null)
      setContractInfo(null)
    }
  }, [isConnected, address, refreshData])

  // Update network when chain changes
  useEffect(() => {
    if (chain) {
      setCurrentNetwork(chain.id)
    }
  }, [chain])

  return {
    // Connection state
    isConnected: isConnected || false,
    isOwner,
    currentNetwork,
    contractInfo,
    
    // Employee management
    employees,
    activeEmployees,
    loadingEmployees,
    addEmployee,
    getEmployee,
    calculatePaymentAmount,
    
    // Payroll processing
    processPayroll,
    processIndividualPayment,
    
    // Contract management
    isPaused,
    pause,
    unpause,
    getContractBalance,
    
    // Token management
    isTokenAuthorized,
    setTokenAuthorization,
    
    // Utility functions
    switchNetwork,
    refreshData,
  }
}

/**
 * Hook for network management
 */
export const useNetworkStatus = () => {
  const { chain } = useWagmiNetwork()
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  useEffect(() => {
    if (chain) {
      const supportedNetworks = Object.values(NETWORKS).map(n => n.chainId)
      setIsCorrectNetwork(supportedNetworks.includes(chain.id as any))
    } else {
      setIsCorrectNetwork(false)
    }
  }, [chain])

  const switchToMainnet = useCallback(async () => {
    try {
      return await blockchainService.switchNetwork(NETWORKS.MAINNET.chainId)
    } catch (error) {
      console.error('Error switching to mainnet:', error)
      return false
    }
  }, [])

  const switchToSepolia = useCallback(async () => {
    try {
      return await blockchainService.switchNetwork(NETWORKS.SEPOLIA.chainId)
    } catch (error) {
      console.error('Error switching to sepolia:', error)
      return false
    }
  }, [])

  return {
    currentNetwork: chain,
    isCorrectNetwork,
    switchToMainnet,
    switchToSepolia,
    supportedNetworks: Object.values(NETWORKS),
  }
}

/**
 * Hook for contract balance monitoring
 */
export const useContractBalance = (tokenAddress: string, refreshInterval = 30000) => {
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(false)

  const loadBalance = useCallback(async () => {
    setLoading(true)
    try {
      const contractBalance = await blockchainService.getContractBalance(tokenAddress)
      setBalance(contractBalance)
    } catch (error) {
      console.error('Error loading contract balance:', error)
    } finally {
      setLoading(false)
    }
  }, [tokenAddress])

  useEffect(() => {
    loadBalance()
    
    const interval = setInterval(loadBalance, refreshInterval)
    return () => clearInterval(interval)
  }, [loadBalance, refreshInterval])

  return {
    balance,
    loading,
    refresh: loadBalance,
  }
}
