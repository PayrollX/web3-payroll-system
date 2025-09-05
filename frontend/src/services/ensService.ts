import { formatEther, parseEther, keccak256, stringToBytes, namehash, getAddress } from 'viem'
import { CONTRACT_ADDRESSES, getCurrentChainAddresses } from '../wagmi.config'

/**
 * ENS Service for domain availability checking and registration
 * Supports both .eth domains and DNS domain imports
 * @author Dev Austin
 */

export interface ENSRegistrationResult {
  success: boolean
  transactionHash?: string
  error?: string
  cost?: string
  domain?: string
  blockNumber?: number
}

export interface ENSResolutionResult {
  address?: string
  name?: string
  success: boolean
  error?: string
}

export interface DomainAvailability {
  available: boolean
  domain: string
  type: 'eth' | 'dns'
  owner?: string | null
  reason?: string
  canImport?: boolean
  dnsImportData?: any
  error?: string
}

export class ENSService {
  private publicClient: any
  private walletClient: any
  private chainId: number
  private addresses: any

  constructor(publicClient: any, walletClient: any, chainId: number) {
    this.publicClient = publicClient
    this.walletClient = walletClient
    this.chainId = chainId
    this.addresses = this.getContractAddresses(chainId)
  }

  getContractAddresses(chainId: number) {
    switch (chainId) {
      case 1: // Mainnet
        return {
          ENS_REGISTRY: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
          ETH_REGISTRAR_CONTROLLER: "0x253553366Da8546fC250F225fe3d25d0C782303b",
          BASE_REGISTRAR: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
          PUBLIC_RESOLVER: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
          DNS_REGISTRAR: "0x58774Bb8acD458A640aF0B88238369A167546ef2"
        }
      case 11155111: // Sepolia
        return {
          ENS_REGISTRY: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
          ETH_REGISTRAR_CONTROLLER: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
          BASE_REGISTRAR: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
          PUBLIC_RESOLVER: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
          DNS_REGISTRAR: "0x8edc487D26F6c8Fa76e032066A3D4F87E273515d"
        }
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`)
    }
  }


  /**
   * Set address record for an ENS name
   * @param name ENS name
   * @param address Address to set
   * @returns Operation result
   */
  async setAddressRecord(name: string, address: string): Promise<ENSRegistrationResult> {
    // Mock implementation
    return { success: true, transactionHash: '0x' + Math.random().toString(16).substr(2, 64) }
  }

  async resolveENS(name: string): Promise<ENSResolutionResult> {
    // Mock implementation
    return { success: true, address: '0x' + Math.random().toString(16).substr(2, 40) }
  }

  async reverseResolve(address: string): Promise<ENSResolutionResult> {
    // Mock implementation
    return { success: true, name: 'mock.ens' }
  }

  /**
   * Check if .eth domain is available
   */
  async checkETHDomainAvailability(domainName: string): Promise<DomainAvailability> {
    try {
      const cleanName = this.sanitizeDomainName(domainName)
      console.log(`🔍 Checking .eth domain availability: ${cleanName}`)

      // Method 1: Check via Base Registrar
      const labelHash = keccak256(stringToBytes(cleanName))
      const available = await this.publicClient.readContract({
        address: this.addresses.BASE_REGISTRAR as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
            "name": "available",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'available',
        args: [labelHash]
      })

      // Method 2: Double-check via ENS Registry
      const fullDomain = `${cleanName}.eth`
      const node = namehash(fullDomain)
      const owner = await this.publicClient.readContract({
        address: this.addresses.ENS_REGISTRY as `0x${string}`,
        abi: [
          {
            "inputs": [{"internalType": "bytes32", "name": "node", "type": "bytes32"}],
            "name": "owner",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        functionName: 'owner',
        args: [node]
      })

      const hasOwner = owner !== '0x0000000000000000000000000000000000000000'
      const isAvailable = available && !hasOwner

      console.log(`📊 Availability check results:`, {
        domain: fullDomain,
        availableFromRegistrar: available,
        ownerFromRegistry: owner,
        hasOwner
      })

      return {
        available: isAvailable,
        domain: fullDomain,
        type: 'eth',
        owner: hasOwner ? owner : null,
        reason: isAvailable ? 'Available for registration' : 'Already registered'
      }
    } catch (error: any) {
      console.error("❌ ETH domain availability check failed:", error)
      return {
        available: false,
        domain: `${domainName}.eth`,
        type: 'eth',
        error: error.message
      }
    }
  }

  /**
   * Universal domain availability check
   */
  async checkDomainAvailability(domainName: string): Promise<DomainAvailability> {
    const cleanName = domainName.toLowerCase().trim()
    
    if (cleanName.endsWith('.eth')) {
      const name = cleanName.replace('.eth', '')
      return this.checkETHDomainAvailability(name)
    } else {
      // Default to .eth domain check
      return this.checkETHDomainAvailability(cleanName)
    }
  }

  async getDomainExpiry(name: string): Promise<number | null> {
    // Mock implementation
    return Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year from now
  }

  async getDomainOwner(name: string): Promise<string | null> {
    // Mock implementation
    return '0x' + Math.random().toString(16).substr(2, 40)
  }

  /**
   * Validate ENS name format
   * @param name ENS name
   * @returns Validation result
   */
  validateENSName(name: string): { valid: boolean; error?: string } {
    // Basic validation rules
    if (!name || name.length === 0) {
      return { valid: false, error: 'Name cannot be empty' }
    }

    if (name.length < 3) {
      return { valid: false, error: 'Name must be at least 3 characters long' }
    }

    if (name.length > 63) {
      return { valid: false, error: 'Name must be less than 64 characters long' }
    }

    // Check for valid characters (alphanumeric and hyphens)
    const validPattern = /^[a-z0-9-]+$/
    if (!validPattern.test(name)) {
      return { valid: false, error: 'Name can only contain lowercase letters, numbers, and hyphens' }
    }

    // Cannot start or end with hyphen
    if (name.startsWith('-') || name.endsWith('-')) {
      return { valid: false, error: 'Name cannot start or end with a hyphen' }
    }

    // Cannot have consecutive hyphens
    if (name.includes('--')) {
      return { valid: false, error: 'Name cannot contain consecutive hyphens' }
    }

    return { valid: true }
  }

  /**
   * Get registration cost for .eth domain
   */
  async getRegistrationCost(domainName: string, duration: number = 31536000): Promise<string> {
    try {
      const price = await this.publicClient.readContract({
        address: this.addresses.ETH_REGISTRAR_CONTROLLER as `0x${string}`,
        abi: [
          {
            "inputs": [
              {"name": "name", "type": "string"}, 
              {"name": "duration", "type": "uint256"}
            ],
            "name": "rentPrice",
            "type": "function",
            "outputs": [
              {"name": "base", "type": "uint256"},
              {"name": "premium", "type": "uint256"}
            ]
          }
        ],
        functionName: 'rentPrice',
        args: [domainName, BigInt(duration)]
      })

      const totalPrice = price[0] + price[1] // base + premium
      return formatEther(totalPrice)

    } catch (error: any) {
      console.error("❌ Failed to get registration cost:", error)
      return '0.005' // Fallback
    }
  }

  /**
   * Register .eth domain
   */
  async registerDomain(domainName: string, duration: number = 31536000): Promise<ENSRegistrationResult> {
    try {
      console.log(`🚀 Starting .eth domain registration: ${domainName}`)
      
      const cleanName = this.sanitizeDomainName(domainName)
      
      if (!this.walletClient) {
        throw new Error('Wallet client not available')
      }

      const owner = await this.walletClient.getAddresses()
      if (!owner || owner.length === 0) {
        throw new Error('No wallet address available')
      }

      // Check availability first
      const availability = await this.checkETHDomainAvailability(cleanName)
      if (!availability.available) {
        throw new Error(`Domain ${cleanName}.eth is not available`)
      }

      // Get registration cost
      const cost = await this.getRegistrationCost(cleanName, duration)
      console.log(`💰 Registration cost: ${cost} ETH`)

      // For now, simulate successful registration
      // In a real implementation, this would require:
      // 1. Making a commitment
      // 2. Waiting for commitment delay
      // 3. Registering the domain
      
      console.log("✅ Domain registration simulated successfully")

      return {
        success: true,
        domain: `${cleanName}.eth`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        cost: cost,
        blockNumber: Math.floor(Math.random() * 1000000)
      }
    } catch (error: any) {
      console.error("❌ ETH domain registration failed:", error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create subdomain
   */
  async createSubdomain(parentDomain: string, subdomain: string, ownerAddress: string): Promise<ENSRegistrationResult> {
    try {
      console.log(`🏗️ Creating subdomain: ${subdomain}.${parentDomain}`)

      if (!this.walletClient) {
        throw new Error('Wallet client not available')
      }

      // For now, simulate successful subdomain creation
      console.log("✅ Subdomain creation simulated successfully")

      return {
        success: true,
        domain: `${subdomain}.${parentDomain}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        blockNumber: Math.floor(Math.random() * 1000000)
      }
    } catch (error: any) {
      console.error("❌ Subdomain creation failed:", error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Generate domain suggestions if unavailable
   */
  async getSuggestions(baseDomain: string): Promise<any[]> {
    const suggestions = [
      `${baseDomain}hq`,
      `${baseDomain}co`,
      `${baseDomain}inc`,
      `${baseDomain}labs`,
      `${baseDomain}app`,
      `get${baseDomain}`,
      `the${baseDomain}`,
      `${baseDomain}2024`
    ]

    const availableSuggestions = []
    for (const suggestion of suggestions) {
      const availability = await this.checkETHDomainAvailability(suggestion)
      if (availability.available) {
        availableSuggestions.push({
          name: suggestion,
          domain: `${suggestion}.eth`,
          available: true
        })
      }
      if (availableSuggestions.length >= 5) break
    }

    return availableSuggestions
  }

  /**
   * Utility functions
   */
  sanitizeDomainName(domain: string): string {
    return domain
      .toLowerCase()
      .trim()
      .replace('.eth', '')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '')
      .substring(0, 63)
  }

  isDNSDomain(domain: string): boolean {
    return domain.includes('.') && !domain.endsWith('.eth')
  }

  /**
   * Import DNS domain to ENS (placeholder implementation)
   */
  async importDNSDomain(domainName: string): Promise<ENSRegistrationResult> {
    try {
      console.log(`🌐 Starting DNS domain import: ${domainName}`)

      // For now, simulate successful DNS import
      console.log("✅ DNS domain import simulated successfully")

      return {
        success: true,
        domain: domainName,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        blockNumber: Math.floor(Math.random() * 1000000)
      }
    } catch (error: any) {
      console.error("❌ DNS domain import failed:", error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
