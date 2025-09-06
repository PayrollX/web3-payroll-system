import { formatEther, namehash } from 'viem'

/**
 * ENS Service for domain availability checking and registration
 * Supports both .eth domains and DNS domain imports with proper commit-reveal scheme
 * Combined and enhanced version with all features
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
   * Sanitize domain name for ENS
   */
  private sanitizeDomainName(domain: string): string {
    return domain.toLowerCase().replace(/\.eth$/, '').trim()
  }

  /**
   * Generate a random secret for ENS registration
   */
  private generateSecret(): `0x${string}` {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    return `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
  }

  /**
   * Make commitment for ENS registration
   */
  private async makeCommitment(name: string, owner: string, duration: number, secret: string, resolver: string, data: any[], reverseRecord: boolean, fuses: number, wrapperExpiry: number): Promise<string> {
    try {
      const commitment = await this.publicClient.readContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "name", type: "string" },
              { name: "owner", type: "address" },
              { name: "duration", type: "uint256" },
              { name: "secret", type: "bytes32" },
              { name: "resolver", type: "address" },
              { name: "data", type: "bytes[]" },
              { name: "reverseRecord", type: "bool" },
              { name: "fuses", type: "uint32" },
              { name: "wrapperExpiry", type: "uint64" }
            ],
            name: "makeCommitment",
            outputs: [{ name: "", type: "bytes32" }],
            stateMutability: "pure",
            type: "function"
          }
        ],
        functionName: 'makeCommitment',
        args: [name, owner, BigInt(duration), secret, resolver, data, reverseRecord, fuses, BigInt(wrapperExpiry)]
      })
      
      return commitment as string
    } catch (error) {
      console.error('Error making commitment:', error)
      throw error
    }
  }

  /**
   * Get registration cost for a domain
   */
  async getRegistrationCost(domainName: string, duration: number = 31536000): Promise<string> {
    try {
      const cleanName = this.sanitizeDomainName(domainName)
      
      if (cleanName.length < 3) {
        throw new Error('Domain name must be at least 3 characters long')
      }

      // Try to get cost from ENS registrar controller
      try {
        const price = await this.publicClient.readContract({
          address: this.addresses.ethRegistrarController as `0x${string}`,
          abi: [
            {
              inputs: [
                { name: "name", type: "string" },
                { name: "duration", type: "uint256" }
              ],
              name: "rentPrice",
              outputs: [{ name: "base", type: "uint256" }, { name: "premium", type: "uint256" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'rentPrice',
          args: [cleanName, BigInt(duration)]
        }) as { base: bigint; premium: bigint }

        const totalPrice = price.base + price.premium
        return formatEther(totalPrice)
        
      } catch (error) {
        console.warn('Could not get cost from registrar controller:', error)
        return '0.001' // Default fallback cost
      }
    } catch (error: any) {
      console.error('Error getting registration cost:', error)
      throw new Error(error.message || 'Failed to get registration cost')
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
      // For other domains, return that they're not available for ENS registration
      return {
        available: false,
        domain: cleanDomain,
        type: 'dns',
        reason: 'DNS domain import not yet supported'
      }
    }
  }

  /**
   * Check ETH domain availability
   */
  async checkETHDomainAvailability(domainName: string): Promise<DomainAvailability> {
    try {
      const cleanName = this.sanitizeDomainName(domainName)
      
      if (cleanName.length < 3) {
        return {
          available: false,
          domain: `${cleanName}.eth`,
          type: 'eth',
          reason: 'Domain name must be at least 3 characters'
        }
      }

      const available = await this.publicClient.readContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "name", type: "string" }],
            name: "available",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: 'available',
        args: [cleanName]
      })

      if (!available) {
        // Check who owns it
        try {
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

          return {
            available: false,
            domain: `${cleanName}.eth`,
            type: 'eth',
            owner: owner as string,
            reason: 'Domain is already registered'
          }
        } catch (error) {
          return {
            available: false,
            domain: `${cleanName}.eth`,
            type: 'eth',
            reason: 'Domain is not available'
          }
        }
      }

      return {
        available: true,
        domain: `${cleanName}.eth`,
        type: 'eth'
      }

    } catch (error: any) {
      console.error('Error checking ETH domain availability:', error)
      return {
        available: false,
        domain: `${domainName}.eth`,
        type: 'eth',
        error: error.message || 'Failed to check availability'
      }
    }
  }

  /**
   * Register domain using proper ENS commit-reveal scheme
   */
  async registerDomainReal(domainName: string, duration: number = 31536000): Promise<ENSRegistrationResult> {
    try {
      console.log(`🚀 Starting ENS registration with commit-reveal: ${domainName}`)
      
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

      if (cleanName.length < 3) {
        throw new Error('Domain name must be at least 3 characters long')
      }

      if (!/^[a-z0-9-]+$/.test(cleanName)) {
        throw new Error('Domain name can only contain lowercase letters, numbers, and hyphens')
      }

      console.log(`🚀 Starting ENS registration for: ${cleanName}.eth`)
      console.log(`👤 Owner: ${ownerAddress}`)
      console.log(`⏰ Duration: ${duration} seconds (${Math.floor(duration / 86400)} days)`)

      // Step 1: Check domain availability
      console.log(`🔍 Checking domain availability...`)
      
      const available = await this.publicClient.readContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "name", type: "string" }],
            name: "available",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: 'available',
        args: [cleanName]
      })

      if (!available) {
        throw new Error(`Domain ${cleanName}.eth is not available for registration`)
      }

      console.log(`✅ Domain ${cleanName}.eth is available`)

      // Step 2: Get registration cost with buffer
      console.log(`💰 Getting registration cost...`)
      
      const price = await this.publicClient.readContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "name", type: "string" },
              { name: "duration", type: "uint256" }
            ],
            name: "rentPrice",
            outputs: [{ name: "base", type: "uint256" }, { name: "premium", type: "uint256" }],
            stateMutability: "view",
            type: "function"
          }
        ],
        functionName: 'rentPrice',
        args: [cleanName, BigInt(duration)]
      }) as { base: bigint; premium: bigint }

      const totalPrice = price.base + price.premium
      // Fix: Ensure we're using BigInt multiplication and division
      const bufferPercent = BigInt(20); // Explicitly define as BigInt
      const bufferDivisor = BigInt(100); // Explicitly define as BigInt
      const priceWithBuffer = totalPrice + ((totalPrice * bufferPercent) / bufferDivisor)
      
      console.log(`💰 Base price: ${formatEther(price.base)} ETH`)
      console.log(`💰 Premium: ${formatEther(price.premium)} ETH`)
      console.log(`💰 Total price: ${formatEther(totalPrice)} ETH`)
      console.log(`💰 Price with buffer: ${formatEther(priceWithBuffer)} ETH`)

      // Step 3: Check wallet balance
      const balance = await this.publicClient.getBalance({
        address: ownerAddress as `0x${string}`
      })

      console.log(`💰 Wallet balance: ${formatEther(balance)} ETH`)

      if (balance < priceWithBuffer) {
        throw new Error(`Insufficient balance. Need ${formatEther(priceWithBuffer)} ETH, have ${formatEther(balance)} ETH`)
      }

      // Step 4: Generate secret and make commitment
      console.log(`🔒 Generating commitment...`)
      
      const secret = this.generateSecret()
      const resolver = this.addresses.publicResolver
      const data: any[] = []
      const reverseRecord = false
      const fuses = 0
      const wrapperExpiry = 0

      const commitment = await this.makeCommitment(
        cleanName,
        ownerAddress,
        duration,
        secret,
        resolver,
        data,
        reverseRecord,
        fuses,
        wrapperExpiry
      )

      console.log(`🔒 Commitment created: ${commitment}`)

      // Step 5: Submit commitment
      console.log(`📝 Submitting commitment...`)
      
      const commitTx = await this.walletClient.writeContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "commitment", type: "bytes32" }],
            name: "commit",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
          }
        ],
        functionName: 'commit',
        args: [commitment],
        gas: BigInt(100000)
      })

      console.log(`📝 Commitment transaction: ${commitTx}`)
      
      // Wait for commitment confirmation
      await this.publicClient.waitForTransactionReceipt({
        hash: commitTx,
        confirmations: 1,
        timeout: 60000
      })

      console.log(`✅ Commitment confirmed`)

      // Step 6: Wait minimum delay (60 seconds for Sepolia)
      console.log(`⏳ Waiting 65 seconds for commitment delay...`)
      await new Promise(resolve => setTimeout(resolve, 65000))

      // Step 7: Register domain
      console.log(`🏷️ Registering domain...`)
      
      const registerTx = await this.walletClient.writeContract({
        address: this.addresses.ethRegistrarController as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "name", type: "string" },
              { name: "owner", type: "address" },
              { name: "duration", type: "uint256" },
              { name: "secret", type: "bytes32" },
              { name: "resolver", type: "address" },
              { name: "data", type: "bytes[]" },
              { name: "reverseRecord", type: "bool" },
              { name: "fuses", type: "uint32" },
              { name: "wrapperExpiry", type: "uint64" }
            ],
            name: "register",
            outputs: [],
            stateMutability: "payable",
            type: "function"
          }
        ],
        functionName: 'register',
        args: [cleanName, ownerAddress, BigInt(duration), secret, resolver, data, reverseRecord, fuses, BigInt(wrapperExpiry)],
        value: priceWithBuffer,
        gas: BigInt(300000)
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

      // Step 8: Verify registration
      console.log(`🔍 Verifying registration...`)
      
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait for state update
      
      try {
        const ensNode = namehash(`${cleanName}.eth`)
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
        cost: formatEther(totalPrice),
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
   * Register domain - alias for registerDomainReal for backward compatibility
   */
  async registerDomain(domainName: string, duration: number = 31536000): Promise<ENSRegistrationResult> {
    return this.registerDomainReal(domainName, duration)
  }

  /**
   * Import DNS domain (placeholder implementation)
   */
  async importDNSDomain(domainName: string): Promise<ENSRegistrationResult> {
    try {
      console.log(`🔄 DNS domain import not fully implemented: ${domainName}`)
      
      // For now, return a placeholder response
      return {
        success: false,
        error: 'DNS domain import feature is not yet available'
      }
    } catch (error: any) {
      console.error('DNS domain import error:', error)
      return {
        success: false,
        error: error.message || 'DNS import failed'
      }
    }
  }

  /**
   * Create subdomain (simplified implementation)
   */
  async createSubdomain(parentDomain: string, subdomain: string, ownerAddress: string): Promise<ENSRegistrationResult> {
    try {
      console.log(`🔄 Creating subdomain: ${subdomain}.${parentDomain}`)
      
      // This would require the parent domain owner to call setSubnodeRecord
      // For now, return a placeholder response
      return {
        success: false,
        error: 'Subdomain creation feature requires parent domain ownership verification'
      }
    } catch (error: any) {
      console.error('Subdomain creation error:', error)
      return {
        success: false,
        error: error.message || 'Subdomain creation failed'
      }
    }
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENSName(ensName: string): Promise<ENSResolutionResult> {
    try {
      const address = await this.publicClient.getEnsAddress({
        name: ensName
      })

      if (address) {
        return {
          address,
          name: ensName,
          success: true
        }
      } else {
        return {
          success: false,
          error: 'ENS name not found or not configured'
        }
      }
    } catch (error: any) {
      console.error('ENS resolution error:', error)
      return {
        success: false,
        error: error.message || 'Resolution failed'
      }
    }
  }

  /**
   * Get domain suggestions based on a base name
   */
  async getSuggestions(baseName: string): Promise<string[]> {
    const cleanBase = this.sanitizeDomainName(baseName)
    const suggestions = []
    
    // Add common suffixes
    const suffixes = ['co', 'inc', 'ltd', 'corp', 'group', 'team', 'dev', 'tech', 'app', 'dao', 'lab', 'pro']
    
    for (const suffix of suffixes) {
      const suggestion = `${cleanBase}${suffix}`
      if (suggestion.length >= 3 && suggestion.length <= 20) {
        try {
          const availability = await this.checkETHDomainAvailability(suggestion)
          if (availability.available) {
            suggestions.push(`${suggestion}.eth`)
          }
        } catch (error) {
          // Continue if checking fails
          console.warn(`Could not check availability for ${suggestion}:`, error)
        }
      }
      
      // Limit to 5 suggestions to avoid too many API calls
      if (suggestions.length >= 5) break
    }
    
    return suggestions
  }

  /**
   * Get domain suggestions (sync version)
   */
  getSuggestionsSync(query: string): string[] {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const suggestions = [
      cleanQuery,
      `${cleanQuery}co`,
      `${cleanQuery}inc`,
      `${cleanQuery}ltd`,
      `${cleanQuery}app`,
      `${cleanQuery}dao`,
      `${cleanQuery}dev`,
      `${cleanQuery}tech`,
      `${cleanQuery}lab`,
      `${cleanQuery}pro`
    ].filter(s => s.length >= 3 && s.length <= 20)
    
    return suggestions.slice(0, 5).map(s => `${s}.eth`)
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
}

export default ENSService
// Make sure this file is treated as a module
export {}
