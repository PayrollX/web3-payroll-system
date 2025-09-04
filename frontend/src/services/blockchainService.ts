/**
 * Blockchain service for Web3 Payroll System
 * Handles all contract interactions and blockchain operations
 * @author Dev Austin
 */

import { ethers } from 'ethers'
import { 
  CONTRACT_ABIS, 
  CONTRACT_ADDRESSES, 
  NETWORKS, 
  TOKEN_ADDRESSES,
  PAYMENT_FREQUENCIES,
  ERROR_MESSAGES,
  DEFAULTS
} from '../contracts/constants'

export interface Employee {
  walletAddress: string
  salaryAmount: string
  lastPaymentTimestamp: number
  isActive: boolean
  ensNode: string
  frequency: number
  preferredToken: string
  ensSubdomain: string
  startDate: number
  position: string
  department: string
}

export interface AddEmployeeParams {
  employee: string
  salary: string
  subdomain: string
  frequency: number
  token: string
  position: string
  department: string
}

export interface PaymentResult {
  success: boolean
  transactionHash?: string
  error?: string
}

export interface ContractInfo {
  address: string
  abi: any[]
  network: string
}

/**
 * Blockchain service class for contract interactions
 */
export class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null
  private signer: ethers.Signer | null = null
  private contract: ethers.Contract | null = null
  private currentNetwork: number | null = null

  constructor() {
    this.initializeProvider()
  }

  /**
   * Initialize provider and signer
   */
  private async initializeProvider() {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum as any)
        this.signer = this.provider.getSigner()
        
        // Get current network
        const network = await this.provider.getNetwork()
        this.currentNetwork = network.chainId
        
        console.log('🔗 Blockchain service initialized on network:', network.name)
      }
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error)
    }
  }

  /**
   * Get contract instance
   */
  private getContract(): ethers.Contract {
    if (!this.signer || !this.currentNetwork) {
      throw new Error(ERROR_MESSAGES.WALLET_NOT_CONNECTED)
    }

    const contractAddress = CONTRACT_ADDRESSES[this.currentNetwork as keyof typeof CONTRACT_ADDRESSES]?.PayrollManager
    if (!contractAddress) {
      throw new Error(ERROR_MESSAGES.CONTRACT_NOT_DEPLOYED)
    }

    return new ethers.Contract(
      contractAddress,
      CONTRACT_ABIS.PayrollManager,
      this.signer
    )
  }

  /**
   * Check if wallet is connected
   */
  async isWalletConnected(): Promise<boolean> {
    try {
      if (!this.provider) return false
      const accounts = await this.provider.listAccounts()
      return accounts.length > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Get current network
   */
  async getCurrentNetwork(): Promise<number | null> {
    try {
      if (!this.provider) return null
      const network = await this.provider.getNetwork()
      return network.chainId
    } catch (error) {
      console.error('Error getting current network:', error)
      return null
    }
  }

  /**
   * Switch to a specific network
   */
  async switchNetwork(chainId: number): Promise<boolean> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })

      // Reinitialize after network switch
      await this.initializeProvider()
      return true
    } catch (error: any) {
      console.error('Network switch failed:', error)
      
      // If network doesn't exist, try to add it
      if (error.code === 4902) {
        return await this.addNetwork(chainId)
      }
      
      return false
    }
  }

  /**
   * Add a new network
   */
  private async addNetwork(chainId: number): Promise<boolean> {
    try {
      const network = Object.values(NETWORKS).find(n => n.chainId === chainId)
      if (!network) {
        throw new Error('Network not supported')
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }
      
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: network.name,
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.blockExplorer],
        }],
      })

      return true
    } catch (error) {
      console.error('Failed to add network:', error)
      return false
    }
  }

  /**
   * Get contract owner
   */
  async getContractOwner(): Promise<string> {
    try {
      const contract = this.getContract()
      return await contract.owner()
    } catch (error) {
      console.error('Error getting contract owner:', error)
      throw error
    }
  }

  /**
   * Check if address is contract owner
   */
  async isOwner(address: string): Promise<boolean> {
    try {
      const owner = await this.getContractOwner()
      return owner.toLowerCase() === address.toLowerCase()
    } catch (error) {
      console.error('Error checking ownership:', error)
      return false
    }
  }

  /**
   * Get contract info
   */
  getContractInfo(): ContractInfo | null {
    if (!this.currentNetwork) return null

    const contractAddress = CONTRACT_ADDRESSES[this.currentNetwork as keyof typeof CONTRACT_ADDRESSES]?.PayrollManager
    if (!contractAddress) return null

    const network = Object.values(NETWORKS).find(n => n.chainId === this.currentNetwork)

    return {
      address: contractAddress,
      abi: CONTRACT_ABIS.PayrollManager,
      network: network?.name || 'Unknown'
    }
  }

  /**
   * Add a new employee
   */
  async addEmployee(params: AddEmployeeParams): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      // Convert salary to wei
      const salaryWei = ethers.utils.parseEther(params.salary)
      
      // Estimate gas
      const gasEstimate = await contract.estimateGas.addEmployee(
        params.employee,
        salaryWei,
        params.subdomain,
        params.frequency,
        params.token,
        params.position,
        params.department
      )

      // Execute transaction
      const tx = await contract.addEmployee(
        params.employee,
        salaryWei,
        params.subdomain,
        params.frequency,
        params.token,
        params.position,
        params.department,
        {
          gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        }
      )

      console.log('📝 Employee addition transaction sent:', tx.hash)
      
      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('✅ Employee added successfully:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to add employee:', error)
      return {
        success: false,
        error: error.message || 'Failed to add employee'
      }
    }
  }

  /**
   * Get employee information
   */
  async getEmployee(address: string): Promise<Employee | null> {
    try {
      const contract = this.getContract()
      const employeeData = await contract.employees(address)
      
      return {
        walletAddress: employeeData.walletAddress,
        salaryAmount: ethers.utils.formatEther(employeeData.salaryAmount),
        lastPaymentTimestamp: employeeData.lastPaymentTimestamp.toNumber(),
        isActive: employeeData.isActive,
        ensNode: employeeData.ensNode,
        frequency: employeeData.frequency,
        preferredToken: employeeData.preferredToken,
        ensSubdomain: employeeData.ensSubdomain,
        startDate: employeeData.startDate.toNumber(),
        position: employeeData.position,
        department: employeeData.department,
      }
    } catch (error) {
      console.error('Error getting employee:', error)
      return null
    }
  }

  /**
   * Get all active employees
   */
  async getActiveEmployees(): Promise<string[]> {
    try {
      const contract = this.getContract()
      return await contract.getActiveEmployees()
    } catch (error) {
      console.error('Error getting active employees:', error)
      return []
    }
  }

  /**
   * Calculate payment amount for an employee
   */
  async calculatePaymentAmount(employeeAddress: string): Promise<string> {
    try {
      const contract = this.getContract()
      const amount = await contract.calculatePaymentAmount(employeeAddress)
      return ethers.utils.formatEther(amount)
    } catch (error) {
      console.error('Error calculating payment amount:', error)
      return '0'
    }
  }

  /**
   * Process payroll for multiple employees
   */
  async processPayroll(employeeAddresses: string[]): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      // Estimate gas
      const gasEstimate = await contract.estimateGas.processPayroll(employeeAddresses)

      // Execute transaction
      const tx = await contract.processPayroll(employeeAddresses, {
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
      })

      console.log('📝 Payroll processing transaction sent:', tx.hash)
      
      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('✅ Payroll processed successfully:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to process payroll:', error)
      return {
        success: false,
        error: error.message || 'Failed to process payroll'
      }
    }
  }

  /**
   * Process individual payment
   */
  async processIndividualPayment(employeeAddress: string): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      // Estimate gas
      const gasEstimate = await contract.estimateGas.processIndividualPayment(employeeAddress)

      // Execute transaction
      const tx = await contract.processIndividualPayment(employeeAddress, {
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
      })

      console.log('📝 Individual payment transaction sent:', tx.hash)
      
      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('✅ Individual payment processed:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to process individual payment:', error)
      return {
        success: false,
        error: error.message || 'Failed to process payment'
      }
    }
  }

  /**
   * Check if token is authorized
   */
  async isTokenAuthorized(tokenAddress: string): Promise<boolean> {
    try {
      const contract = this.getContract()
      return await contract.authorizedTokens(tokenAddress)
    } catch (error) {
      console.error('Error checking token authorization:', error)
      return false
    }
  }

  /**
   * Set token authorization
   */
  async setTokenAuthorization(tokenAddress: string, authorized: boolean): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      const tx = await contract.setTokenAuthorization(tokenAddress, authorized, {
        gasLimit: DEFAULTS.GAS_LIMIT,
      })

      console.log('📝 Token authorization transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ Token authorization updated:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to set token authorization:', error)
      return {
        success: false,
        error: error.message || 'Failed to update token authorization'
      }
    }
  }

  /**
   * Get contract balance for a token
   */
  async getContractBalance(tokenAddress: string): Promise<string> {
    try {
      if (!this.provider || !this.currentNetwork) return '0'

      const contractInfo = this.getContractInfo()
      if (!contractInfo) return '0'

      if (tokenAddress === TOKEN_ADDRESSES[this.currentNetwork as keyof typeof TOKEN_ADDRESSES].ETH) {
        // ETH balance
        const balance = await this.provider.getBalance(contractInfo.address)
        return ethers.utils.formatEther(balance)
      } else {
        // ERC20 token balance
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          this.provider
        )
        const balance = await tokenContract.balanceOf(contractInfo.address)
        return ethers.utils.formatEther(balance)
      }
    } catch (error) {
      console.error('Error getting contract balance:', error)
      return '0'
    }
  }

  /**
   * Check if contract is paused
   */
  async isPaused(): Promise<boolean> {
    try {
      const contract = this.getContract()
      return await contract.paused()
    } catch (error) {
      console.error('Error checking pause status:', error)
      return false
    }
  }

  /**
   * Pause contract
   */
  async pause(): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      const tx = await contract.pause({
        gasLimit: DEFAULTS.GAS_LIMIT,
      })

      console.log('📝 Pause transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ Contract paused:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to pause contract:', error)
      return {
        success: false,
        error: error.message || 'Failed to pause contract'
      }
    }
  }

  /**
   * Unpause contract
   */
  async unpause(): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      const tx = await contract.unpause({
        gasLimit: DEFAULTS.GAS_LIMIT,
      })

      console.log('📝 Unpause transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ Contract unpaused:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to unpause contract:', error)
      return {
        success: false,
        error: error.message || 'Failed to unpause contract'
      }
    }
  }

  /**
   * Emergency withdraw
   */
  async emergencyWithdraw(tokenAddress: string, amount: string): Promise<PaymentResult> {
    try {
      const contract = this.getContract()
      
      const amountWei = tokenAddress === TOKEN_ADDRESSES[this.currentNetwork as keyof typeof TOKEN_ADDRESSES].ETH
        ? ethers.utils.parseEther(amount)
        : ethers.utils.parseEther(amount)

      const tx = await contract.emergencyWithdraw(tokenAddress, amountWei, {
        gasLimit: DEFAULTS.GAS_LIMIT,
      })

      console.log('📝 Emergency withdraw transaction sent:', tx.hash)
      
      const receipt = await tx.wait()
      console.log('✅ Emergency withdraw completed:', receipt.transactionHash)

      return {
        success: true,
        transactionHash: receipt.transactionHash
      }
    } catch (error: any) {
      console.error('❌ Failed to emergency withdraw:', error)
      return {
        success: false,
        error: error.message || 'Failed to emergency withdraw'
      }
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService()
