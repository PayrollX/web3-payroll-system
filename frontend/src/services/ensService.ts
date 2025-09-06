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
  private currentSecret: `0x${string}` | null = null

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
    const secret = `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`
    console.log(`🔍 DEBUG: generateSecret() called, generated: ${secret}`)
    console.log(`🔍 DEBUG: Current class secret before generation: ${this.currentSecret}`)
    return secret
  }

  /**
   * Make commitment for ENS registration
   */
  private async makeCommitment(
    name: string,
    owner: string,
    duration: bigint,
    secret: `0x${string}`,
    resolver: string,
    data: any[],
    reverseRecord: boolean,
    ownerControlledFuses: number = 0
  ): Promise<`0x${string}`> {
    try {
      console.log(`🔒 Making commitment with params:`, {
        name,
        owner,
        duration: duration.toString(),
        secret,
        resolver,
        data,
        reverseRecord,
        ownerControlledFuses
      })

      // Use the on-chain makeCommitment function to ensure hash matches controller expectations
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
              { name: "ownerControlledFuses", type: "uint16" }
            ],
            name: "makeCommitment",
            outputs: [{ name: "", type: "bytes32" }],
            stateMutability: "pure",
            type: "function"
          }
        ],
        functionName: 'makeCommitment',
        args: [name, owner, duration, secret, resolver, data, reverseRecord, ownerControlledFuses]
      })
      
      console.log(`🔒 Commitment created by on-chain makeCommitment: ${commitment}`)
      return commitment as `0x${string}`
      
    } catch (error) {
      console.error('Error making commitment:', error)
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('reverted')) {
          throw new Error(`Failed to create commitment for ${name}.eth. Please try a different domain name.`)
        }
        if (error.message.includes('timeout')) {
          throw new Error('Network timeout. Please check your connection and try again.')
        }
      }
      
      throw error
    }
  }


  /**
   * Generate a random domain name for testing
   */
  generateRandomDomainName(): string {
    const adjectives = ['cool', 'fast', 'smart', 'bright', 'quick', 'bold', 'wise', 'keen', 'sharp', 'swift']
    const nouns = ['cat', 'dog', 'bird', 'fish', 'lion', 'bear', 'wolf', 'fox', 'deer', 'owl']
    const numbers = Math.floor(Math.random() * 9999)
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    
    return `${adjective}${noun}${numbers}`
  }

  /**
   * Find an available domain name by trying variations
   */
  async findAvailableDomain(baseName: string, maxAttempts: number = 5): Promise<string | null> {
    const cleanBase = this.sanitizeDomainName(baseName)
    
    // Try the original name first
    const availability = await this.checkDomainAvailability(cleanBase)
    if (availability.available) {
      return cleanBase
    }
    
    // Try variations with numbers
    for (let i = 1; i <= maxAttempts; i++) {
      const variation = `${cleanBase}${i}`
      const varAvailability = await this.checkDomainAvailability(variation)
      if (varAvailability.available) {
        return variation
      }
    }
    
    // Try random names
    for (let i = 0; i < 3; i++) {
      const randomName = this.generateRandomDomainName()
      const randomAvailability = await this.checkDomainAvailability(randomName)
      if (randomAvailability.available) {
        return randomName
      }
    }
    
    return null
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

      // Step 1: Check domain availability with retry logic
      console.log(`🔍 Checking domain availability...`)
      
      let available = false
      let availabilityCheckAttempts = 0
      const maxAvailabilityAttempts = 3

      while (availabilityCheckAttempts < maxAvailabilityAttempts && !available) {
        try {
          available = await this.publicClient.readContract({
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
          
          if (available) {
            console.log(`✅ Domain ${cleanName}.eth is available`)
            break
          } else {
            console.log(`❌ Domain ${cleanName}.eth is not available`)
            throw new Error(`Domain ${cleanName}.eth is not available for registration`)
          }
        } catch (error) {
          availabilityCheckAttempts++
          console.log(`⚠️ Availability check attempt ${availabilityCheckAttempts} failed:`, error)
          
          if (availabilityCheckAttempts >= maxAvailabilityAttempts) {
            // If all attempts fail, assume domain is available and let the commitment check handle it
            console.log(`⚠️ All availability checks failed, proceeding with registration attempt`)
            available = true
            break
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Step 2: Get registration cost with buffer
      console.log(`💰 Getting registration cost...`)
      
      const priceResult = await this.publicClient.readContract({
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
      });

      const basePrice = (Array.isArray(priceResult) ? priceResult[0] : (priceResult as any).base) as bigint;
      const premiumPrice = (Array.isArray(priceResult) ? priceResult[1] : (priceResult as any).premium) as bigint;

      if (typeof basePrice !== 'bigint' || typeof premiumPrice !== 'bigint') {
        console.error('Invalid price data received from contract', { basePrice, premiumPrice });
        throw new Error('Invalid price data received from contract.');
      }

      const totalPrice = basePrice + premiumPrice
      
      // Calculate 20% buffer: totalPrice * 1.2 = totalPrice * 120/100
      const priceWithBuffer = (totalPrice * 120n) / 100n

      console.log(`💰 Base price: ${formatEther(basePrice)} ETH`)
      console.log(`💰 Premium: ${formatEther(premiumPrice)} ETH`)
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
      this.currentSecret = secret // Store the secret in class property
      const durationBI = BigInt(duration)
      
      // Debug: Log the generated secret immediately
      console.log(`🔍 DEBUG: Generated secret: ${secret}`)
      console.log(`🔍 DEBUG: Stored secret in class property: ${this.currentSecret}`)
      console.log(`🔍 DEBUG: Secret equality check: ${secret === this.currentSecret}`)

      const commitment = await this.makeCommitment(
        cleanName,
        ownerAddress,
        durationBI,
        secret,
        this.addresses.publicResolver,
        [], // data array (empty)
        false, // reverseRecord
        0 // ownerControlledFuses
      )

      console.log(`🔒 Commitment created: ${commitment}`)

      // Step 5: Commit to the registration
      console.log(`📝 Submitting commitment...`)
      
      // Estimate gas for commit transaction
      console.log(`⛽ Estimating gas for commit...`)
      let commitGasEstimate: bigint
      try {
        commitGasEstimate = await this.publicClient.estimateContractGas({
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
          account: ownerAddress as `0x${string}`
        })
        
        console.log(`⛽ Commit gas estimate: ${commitGasEstimate}`)
        commitGasEstimate = commitGasEstimate * BigInt(120) / BigInt(100) // 20% buffer
      } catch (commitGasError) {
        console.log(`⚠️ Commit gas estimation failed, using fallback: ${commitGasError}`)
        commitGasEstimate = BigInt(150000) // Higher fallback
      }

      // Get gas fees for commit transaction
      let commitFeeData
      try {
        commitFeeData = await this.publicClient.estimateFeesPerGas()
      } catch (commitFeeError) {
        console.log(`⚠️ Commit fee estimation failed, using fallback: ${commitFeeError}`)
        commitFeeData = {
          maxFeePerGas: BigInt(20000000000), // 20 gwei
          maxPriorityFeePerGas: BigInt(2000000000) // 2 gwei
        }
      }
      
      const commitMaxFeePerGas = commitFeeData.maxFeePerGas ? commitFeeData.maxFeePerGas * BigInt(120) / BigInt(100) : BigInt(24000000000) // 24 gwei fallback
      const commitMaxPriorityFeePerGas = commitFeeData.maxPriorityFeePerGas ? commitFeeData.maxPriorityFeePerGas * BigInt(120) / BigInt(100) : BigInt(2400000000) // 2.4 gwei fallback
      
      console.log(`⛽ Commit max fee per gas: ${commitMaxFeePerGas}`)
      console.log(`⛽ Commit max priority fee per gas: ${commitMaxPriorityFeePerGas}`)

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
        gas: commitGasEstimate,
        maxFeePerGas: commitMaxFeePerGas,
        maxPriorityFeePerGas: commitMaxPriorityFeePerGas
      })

      console.log(`📝 Commitment transaction: ${commitTx}`)
      
      // Wait for commitment confirmation with longer timeout
      console.log(`⏳ Waiting for commitment confirmation...`)
      try {
        const commitReceipt = await this.publicClient.waitForTransactionReceipt({
          hash: commitTx,
          confirmations: 1,
          timeout: 180000 // 3 minutes timeout
        })
        
        console.log(`✅ Commitment confirmed! Block: ${commitReceipt.blockNumber}`)
        console.log(`📊 Commit gas used: ${commitReceipt.gasUsed}`)
        
        if (commitReceipt.status !== 'success') {
          throw new Error(`Commitment transaction failed with status: ${commitReceipt.status}`)
        }
      } catch (timeoutError) {
        console.log(`⚠️ Commitment confirmation timeout, but transaction was submitted: ${commitTx}`)
        console.log(`🔍 You can check the transaction status on Etherscan: https://sepolia.etherscan.io/tx/${commitTx}`)
        
        // Continue with the process - the transaction might still succeed
        console.log(`⏭️ Continuing with registration process...`)
      }

      // Step 6: Wait minimum delay (60 seconds for Sepolia)
      console.log(`⏳ Waiting 65 seconds for commitment delay...`)
      await new Promise(resolve => setTimeout(resolve, 65000))

      // Step 7: Register domain
      console.log(`🏷️ Registering domain...`)
      
      const resolver = this.addresses.publicResolver
      const data: any[] = []
      const reverseRecord = false
      
      // Double-check that the commitment is still valid
      console.log(`🔍 Verifying commitment before registration...`)
      let commitmentValid = false
      try {
        const commitmentTimestamp = await this.publicClient.readContract({
          address: this.addresses.ethRegistrarController as `0x${string}`,
          abi: [
            {
              inputs: [{ name: "commitment", type: "bytes32" }],
              name: "commitments",
              outputs: [{ name: "", type: "uint256" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'commitments',
          args: [commitment]
        })
        
        if (commitmentTimestamp > 0) {
          commitmentValid = true
          console.log(`🔍 Commitment timestamp: ${commitmentTimestamp}`)
          const currentTime = Math.floor(Date.now() / 1000)
          const commitmentAge = currentTime - Number(commitmentTimestamp)
          console.log(`🔍 Commitment age: ${commitmentAge} seconds`)
          
          if (commitmentAge < 60) {
            console.log(`⚠️ Commitment too new, waiting additional ${60 - commitmentAge} seconds...`)
            await new Promise(resolve => setTimeout(resolve, (60 - commitmentAge) * 1000))
          }
        } else {
          console.log(`⚠️ Commitment not found on chain. The commit transaction may have failed.`)
        }
      } catch (commitmentError) {
        console.log(`⚠️ Could not verify commitment: ${commitmentError}`)
        console.log(`⚠️ This might mean the commit transaction failed or is still pending.`)
      }
      
      if (!commitmentValid) {
        throw new Error(`Commitment verification failed. The commit transaction may have failed. Please check Etherscan: https://sepolia.etherscan.io/tx/${commitTx}`)
      }
      
      // Final check: ensure domain is still available
      console.log(`🔍 Final availability check before registration...`)
      const finalAvailability = await this.publicClient.readContract({
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
      
      if (!finalAvailability) {
        throw new Error(`Domain ${cleanName}.eth is no longer available for registration`)
      }
      
      console.log(`✅ Domain ${cleanName}.eth is still available for registration`)
      
      console.log(`🏷️ Registration parameters:`, {
        name: cleanName,
        owner: ownerAddress,
        duration: durationBI.toString(),
        secret,
        resolver,
        data,
        reverseRecord,
        value: totalPrice.toString() + " (exact price, no buffer)"
      })
      
      // Use the stored secret to ensure consistency
      const registrationSecret = this.currentSecret || secret
      
      // Debug: Log the secret that was used for commitment vs registration
      console.log(`🔍 DEBUG: Secret used for commitment: ${secret}`)
      console.log(`🔍 DEBUG: Secret stored in class property: ${this.currentSecret}`)
      console.log(`🔍 DEBUG: Secret being used for registration: ${registrationSecret}`)
      console.log(`🔍 DEBUG: Registration secret equality check: ${registrationSecret === secret}`)
      console.log(`🔍 DEBUG: Registration secret equality with class property: ${registrationSecret === this.currentSecret}`)
      
      // Estimate gas first
      console.log(`⛽ Estimating gas for registration...`)
      let gasEstimate: bigint
      try {
        gasEstimate = await this.publicClient.estimateContractGas({
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
              { name: "ownerControlledFuses", type: "uint16" }
            ],
              name: "register",
              outputs: [],
              stateMutability: "payable",
              type: "function"
            }
          ],
          functionName: 'register',
          args: [cleanName, ownerAddress, durationBI, registrationSecret, resolver, data, reverseRecord, 0], // ownerControlledFuses = 0
          value: totalPrice, // Use exact price, not buffered amount
          account: ownerAddress as `0x${string}`
        })
        
        console.log(`⛽ Gas estimate: ${gasEstimate}`)
        // Add 20% buffer to gas estimate
        gasEstimate = gasEstimate * BigInt(120) / BigInt(100)
        console.log(`⛽ Gas with buffer: ${gasEstimate}`)
      } catch (gasError) {
        console.log(`⚠️ Gas estimation failed, using fallback: ${gasError}`)
        gasEstimate = BigInt(1000000) // Even higher fallback gas limit for registration
        console.log(`⚠️ Using fallback gas limit: ${gasEstimate}`)
      }

      // Get current gas fees for EIP-1559
      let feeData
      try {
        feeData = await this.publicClient.estimateFeesPerGas()
        console.log(`⛽ Fee data:`, feeData)
      } catch (feeError) {
        console.log(`⚠️ Fee estimation failed, using fallback: ${feeError}`)
        // Fallback to reasonable Sepolia gas fees
        feeData = {
          maxFeePerGas: BigInt(20000000000), // 20 gwei
          maxPriorityFeePerGas: BigInt(2000000000) // 2 gwei
        }
      }
      
      // Use EIP-1559 gas fees with buffers
      const maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas * BigInt(120) / BigInt(100) : BigInt(24000000000) // 24 gwei fallback
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas * BigInt(120) / BigInt(100) : BigInt(2400000000) // 2.4 gwei fallback
      
      console.log(`⛽ Max fee per gas: ${maxFeePerGas}`)
      console.log(`⛽ Max priority fee per gas: ${maxPriorityFeePerGas}`)
      
      // Debug: Log the secret and price info before the actual contract call
      console.log(`🔍 DEBUG: About to call writeContract with secret: ${registrationSecret}`)
      console.log(`🔍 DEBUG: Class property at writeContract time: ${this.currentSecret}`)
      console.log(`💰 DEBUG: Using exact totalPrice: ${formatEther(totalPrice)} ETH`)
      console.log(`💰 DEBUG: NOT using buffered price: ${formatEther(priceWithBuffer)} ETH`)
      
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
              { name: "ownerControlledFuses", type: "uint16" }
            ],
            name: "register",
            outputs: [],
            stateMutability: "payable",
            type: "function"
          }
        ],
        functionName: 'register',
        args: [cleanName, ownerAddress, durationBI, registrationSecret, resolver, data, reverseRecord, 0], // ownerControlledFuses = 0
        value: totalPrice, // Use exact price, not buffered amount
        gas: gasEstimate,
        maxFeePerGas,
        maxPriorityFeePerGas
      })
      
      // Debug: Log the secret being used in the actual registration call
      console.log(`🔍 DEBUG: Secret being used in writeContract call: ${registrationSecret}`)

      console.log(`✅ Registration transaction submitted: ${registerTx}`)
      console.log(`⏳ Waiting for confirmation...`)

      // Wait for transaction confirmation with longer timeout
      let receipt
      try {
        receipt = await this.publicClient.waitForTransactionReceipt({
          hash: registerTx,
          confirmations: 2,
          timeout: 300000 // 5 minutes timeout
        })
        
        console.log(`✅ Registration confirmed! Block: ${receipt.blockNumber}`)
        console.log(`📊 Gas used: ${receipt.gasUsed}`)
      } catch (timeoutError) {
        console.log(`⚠️ Registration confirmation timeout, but transaction was submitted: ${registerTx}`)
        console.log(`🔍 You can check the transaction status on Etherscan: https://sepolia.etherscan.io/tx/${registerTx}`)
        
        // Try to get the transaction status anyway
        try {
          receipt = await this.publicClient.getTransactionReceipt({ hash: registerTx })
          if (receipt) {
            console.log(`✅ Registration found! Block: ${receipt.blockNumber}`)
            console.log(`📊 Gas used: ${receipt.gasUsed}`)
          } else {
            throw new Error(`Registration transaction not found. Please check Etherscan: https://sepolia.etherscan.io/tx/${registerTx}`)
          }
        } catch (receiptError) {
          throw new Error(`Registration transaction timeout. Please check Etherscan: https://sepolia.etherscan.io/tx/${registerTx}`)
        }
      }
      
      if (receipt.status !== 'success') {
        // Try to get the revert reason
        let revertReason = 'Unknown revert reason'
        try {
          const tx = await this.publicClient.getTransaction({ hash: registerTx })
          const result = await this.publicClient.call({
            to: tx.to,
            data: tx.input,
            value: tx.value,
            from: tx.from
          })
          revertReason = result.data || 'No revert data available'
        } catch (callError) {
          console.log(`Could not get revert reason: ${callError}`)
        }
        
        throw new Error(`Registration transaction failed with status: ${receipt.status}. Revert reason: ${revertReason}`)
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
