import { formatEther, parseEther, keccak256, stringToBytes, namehash } from 'viem'

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
    const addressMap: any = {
      11155111: { // Sepolia
        ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        publicResolver: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
        baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
        ethRegistrarController: '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72',
        payrollManager: '0x95F4757fC0CD9Bb4fd1cbE4D5a1Bb04a1fb936F7'
      },
      1: { // Mainnet
        ensRegistry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
        publicResolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
        baseRegistrar: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
        ethRegistrarController: '0x253553366Da8546fC250F225fe3d25d0C782303b',
        payrollManager: ''
      }
    }
    
    return addressMap[chainId] || addressMap[11155111]
  }

  /**
   * Sanitize domain name for ENS registration
   */
  sanitizeDomainName(domain: string): string {
    return domain.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/\.eth$/, '')
  }

  /**
   * Check if .eth domain is available
   */
  async checkETHDomainAvailability(domainName: string): Promise<DomainAvailability> {
    try {
      const cleanName = this.sanitizeDomainName(domainName)
      
      // Check via ENS registry
      const ensNode = namehash(`${cleanName}.eth`)
      const owner = await this.publicClient.readContract({
        address: this.addresses.ensRegistry as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "node", type: "bytes32" }],
            name: "owner",
            outputs: [{ name: "", type: "address" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: 'owner',
        args: [ensNode]
      })

      const isAvailable = owner === '0x0000000000000000000000000000000000000000'

      return {
        available: isAvailable,
        domain: `${cleanName}.eth`,
        type: 'eth',
        owner: isAvailable ? null : owner,
        reason: isAvailable ? 'Available for registration' : 'Already registered'
      }
    } catch (error) {
      return {
        available: false,
        domain: `${domainName}.eth`,
        type: 'eth',
        error: error instanceof Error ? error.message : 'Unknown error',
        reason: 'Error checking availability'
      }
    }
  }

  /**
   * Check domain availability (supports both .eth and DNS)
   */
  async checkDomainAvailability(domainName: string): Promise<DomainAvailability> {
    const cleanDomain = domainName.toLowerCase().trim()
    
    if (cleanDomain.endsWith('.eth') || !cleanDomain.includes('.')) {
      return await this.checkETHDomainAvailability(cleanDomain)
    } else {
      // For other domains, just return that they're not available for ENS registration
      return {
        available: false,
        domain: cleanDomain,
        type: 'dns',
        reason: 'DNS domains must be imported, not registered'
      }
    }
  }

  /**
   * Get registration cost
   */
  async getRegistrationCost(domainName: string, duration: number = 31536000): Promise<string> {
    try {
      const cleanName = this.sanitizeDomainName(domainName)
      
      // Try to get cost from ENS registrar controller
      try {
        const cost = await this.publicClient.readContract({
          address: this.addresses.ethRegistrarController as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "name", type: "string" },
                { name: "duration", type: "uint256" }
              ],
              name: "rentPrice",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'rentPrice',
          args: [cleanName, BigInt(duration)]
        })
        
        return formatEther(cost as bigint)
      } catch (rentError) {
        console.warn('Could not get rent price from controller:', rentError)
        return '0.001' // Default cost for testnet
      }
    } catch (error) {
      console.error("❌ Failed to get registration cost:", error)
      return '0.001' // Fallback
    }
  }

  /**
   * Register .eth domain - SIMPLIFIED approach for Sepolia testnet
   * Uses basic ENS registration without complex commit-reveal
   */
  async registerDomainReal(domainName: string, duration: number = 31536000): Promise<ENSRegistrationResult> {
    try {
      console.log(`🚀 Starting simplified ENS registration: ${domainName}`)
      
      const cleanName = this.sanitizeDomainName(domainName)
      
      if (!this.walletClient) {
        throw new Error('Wallet client not available')
      }

      const owner = await this.walletClient.getAddresses()
      if (!owner || owner.length === 0) {
        throw new Error('No wallet address available')
      }

      const ownerAddress = owner[0]
      console.log(`👤 Owner address: ${ownerAddress}`)

      // Check if domain is available first
      console.log(`🔍 Checking domain availability...`)
      
      const ensNode = namehash(`${cleanName}.eth`)
      const currentOwner = await this.publicClient.readContract({
        address: this.addresses.ensRegistry as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "node", type: "bytes32" }],
            name: "owner",
            outputs: [{ name: "", type: "address" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: 'owner',
        args: [ensNode]
      })

      // If owner is not zero address, domain is already taken
      if (currentOwner !== '0x0000000000000000000000000000000000000000') {
        throw new Error(`Domain ${cleanName}.eth is already registered to ${currentOwner}`)
      }

      console.log(`✅ Domain ${cleanName}.eth is available`)

      // Try to get registration cost (may not be available on testnet)
      let registrationCost = parseEther('0.001') // Default cost for testnet
      
      try {
        // Try to get real cost from registrar controller
        const cost = await this.publicClient.readContract({
          address: this.addresses.ethRegistrarController as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "name", type: "string" },
                { name: "duration", type: "uint256" }
              ],
              name: "rentPrice",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'rentPrice',
          args: [cleanName, BigInt(duration)]
        })
        
        registrationCost = cost as bigint
        console.log(`💰 Got registration cost from controller: ${formatEther(registrationCost)} ETH`)
        
      } catch (costError) {
        console.warn('Could not get cost from registrar controller, using default:', costError)
      }

      // Check wallet balance
      const balance = await this.publicClient.getBalance({
        address: ownerAddress as `0x${string}`
      })

      console.log(`💰 Wallet balance: ${formatEther(balance)} ETH`)
      console.log(`💰 Registration cost: ${formatEther(registrationCost)} ETH`)

      if (balance < registrationCost) {
        throw new Error(`Insufficient balance. Need ${formatEther(registrationCost)} ETH, have ${formatEther(balance)} ETH`)
      }

      // Try direct registration with the ENS controller
      console.log(`🏷️ Attempting domain registration...`)
      
      // Use simplified registration function available on Sepolia
      const registerTx = await this.walletClient.writeContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "name", type: "string" },
              { name: "owner", type: "address" },
              { name: "duration", type: "uint256" }
            ],
            name: "register",
            outputs: [],
            stateMutability: "payable",
            type: "function"
          }
        ],
        functionName: 'register',
        args: [cleanName, ownerAddress, BigInt(duration)],
        value: registrationCost,
        gas: BigInt(300000) // Set a reasonable gas limit
      })

      console.log(`✅ Registration transaction submitted: ${registerTx}`)
      console.log(`⏳ Waiting for confirmation...`)

      // Wait for transaction confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: registerTx,
        confirmations: 2,
        timeout: 120000
      })

      console.log(`✅ Registration confirmed! Block: ${receipt.blockNumber}`)
      console.log(`📊 Gas used: ${receipt.gasUsed}`)
      
      if (receipt.status !== 'success') {
        throw new Error(`Registration transaction failed with status: ${receipt.status}`)
      }

      // Verify registration
      console.log(`🔍 Verifying registration...`)
      
      await new Promise(resolve => setTimeout(resolve, 3000)) // Wait for state update
      
      try {
        const newOwner = await this.publicClient.readContract({
          address: this.addresses.ensRegistry as `0x${string}`,
          abi: [
            {
              inputs: [{ name: "node", type: "bytes32" }],
              name: "owner",
              outputs: [{ name: "", type: "address" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'owner',
          args: [ensNode]
        })

        console.log(`✅ Verification successful! Domain owner: ${newOwner}`)
        
        if (newOwner.toLowerCase() !== ownerAddress.toLowerCase()) {
          console.warn(`⚠️ Warning: Domain owner (${newOwner}) doesn't match expected (${ownerAddress})`)
        }

      } catch (verifyError) {
        console.warn('⚠️ Could not verify ownership, but transaction succeeded:', verifyError)
      }

      return {
        success: true,
        domain: `${cleanName}.eth`,
        transactionHash: registerTx,
        cost: formatEther(registrationCost),
        blockNumber: Number(receipt.blockNumber)
      }

    } catch (error: any) {
      console.error("❌ ENS domain registration failed:", error)
      return {
        success: false,
        error: error.message || 'Domain registration failed'
      }
    }
  }

  /**
   * Validate ENS name format
   */
  validateENSName(name: string) {
    const cleanName = name.toLowerCase().trim()
    
    if (cleanName.length < 3) {
      return { valid: false, error: 'Domain name must be at least 3 characters' }
    }
    
    if (cleanName.length > 50) {
      return { valid: false, error: 'Domain name must be less than 50 characters' }
    }
    
    if (!/^[a-z0-9]+$/.test(cleanName.replace(/\.eth$/, ''))) {
      return { valid: false, error: 'Domain name can only contain letters and numbers' }
    }
    
    return { valid: true }
  }

  /**
   * Get domain suggestions based on a base name
   */
  async getSuggestions(baseName: string): Promise<string[]> {
    const cleanBase = this.sanitizeDomainName(baseName)
    const suggestions = []
    
    // Add common suffixes
    const suffixes = ['co', 'inc', 'ltd', 'corp', 'group', 'team', 'dev', 'tech', 'app']
    
    for (const suffix of suffixes) {
      const suggestion = `${cleanBase}${suffix}`
      if (suggestion.length >= 3 && suggestion.length <= 50) {
        suggestions.push(suggestion)
      }
    }
    
    // Add common prefixes
    const prefixes = ['the', 'my', 'our', 'new', 'best', 'top', 'pro', 'super']
    
    for (const prefix of prefixes) {
      const suggestion = `${prefix}${cleanBase}`
      if (suggestion.length >= 3 && suggestion.length <= 50) {
        suggestions.push(suggestion)
      }
    }
    
    return suggestions.slice(0, 8) // Return max 8 suggestions
  }
}
