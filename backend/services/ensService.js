const { ethers } = require('ethers')
const winston = require('winston')

/**
 * ENS Service for real blockchain domain availability checking
 * Checks actual ENS availability on Ethereum, not just local database
 * @author Dev Austin
 */

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/ens.log' }),
  ]
})

// ENS Contract Addresses (Ethereum Mainnet)
const ENS_CONTRACTS = {
  MAINNET: {
    ENS_REGISTRY: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    ETH_REGISTRAR_CONTROLLER: "0x253553366Da8546fC250F225fe3d25d0C782303b",
    BASE_REGISTRAR: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85",
    PUBLIC_RESOLVER: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
  },
  SEPOLIA: {
    ENS_REGISTRY: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
    ETH_REGISTRAR_CONTROLLER: "0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72",
    BASE_REGISTRAR: "0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85", // Same on testnet
    PUBLIC_RESOLVER: "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63",
  },
  // For local testing, we'll use mainnet addresses but with local provider
  LOCAL: {
    ENS_REGISTRY: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Mock
    ETH_REGISTRAR_CONTROLLER: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Mock
    BASE_REGISTRAR: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Mock
    PUBLIC_RESOLVER: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Mock
  }
}

// Minimal ABI for ENS Base Registrar (only need the 'available' function)
const BASE_REGISTRAR_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "available",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
]

// Minimal ABI for ENS Registry (to check owner)
const ENS_REGISTRY_ABI = [
  {
    "inputs": [{"internalType": "bytes32", "name": "node", "type": "bytes32"}],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]

class ENSService {
  constructor() {
    // Initialize providers for different networks
    this.providers = {
      mainnet: this.createProvider('mainnet'),
      sepolia: this.createProvider('sepolia'),
      local: this.createProvider('local')
    }
    
    // Default to local for development
    this.currentNetwork = process.env.NODE_ENV === 'production' ? 'mainnet' : 'local'
    this.provider = this.providers[this.currentNetwork]
    this.contracts = ENS_CONTRACTS[this.currentNetwork.toUpperCase()]
    
    // Initialize contracts
    this.initializeContracts()
  }

  createProvider(network) {
    try {
      switch (network) {
        case 'mainnet':
          if (!process.env.ALCHEMY_API_KEY) {
            logger.warn('No Alchemy API key found for mainnet')
            return null
          }
          return new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
        
        case 'sepolia':
          if (!process.env.ALCHEMY_API_KEY) {
            logger.warn('No Alchemy API key found for sepolia')
            return null
          }
          return new ethers.providers.JsonRpcProvider(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`)
        
        case 'local':
          return new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545')
        
        default:
          throw new Error(`Unknown network: ${network}`)
      }
    } catch (error) {
      logger.error(`Failed to create provider for ${network}:`, error.message)
      return null
    }
  }

  initializeContracts() {
    if (!this.provider) {
      logger.warn('No provider available, ENS checks will be disabled')
      return
    }

    try {
      this.baseRegistrar = new ethers.Contract(
        this.contracts.BASE_REGISTRAR,
        BASE_REGISTRAR_ABI,
        this.provider
      )

      this.ensRegistry = new ethers.Contract(
        this.contracts.ENS_REGISTRY,
        ENS_REGISTRY_ABI,
        this.provider
      )

      logger.info(`ENS contracts initialized for ${this.currentNetwork}`)
    } catch (error) {
      logger.error('Failed to initialize ENS contracts:', error.message)
    }
  }

  /**
   * Check if a domain is available on the ENS blockchain
   * @param {string} domainName - Domain name without .eth (e.g., "mycompany")
   * @returns {Promise<{available: boolean, onChain: boolean, reason?: string}>}
   */
  async checkDomainAvailability(domainName) {
    try {
      // Validate domain name
      if (!domainName || typeof domainName !== 'string') {
        return {
          available: false,
          onChain: false,
          reason: 'Invalid domain name'
        }
      }

      // Clean domain name (remove .eth if present, lowercase, validate format)
      const cleanDomain = domainName.toLowerCase().replace('.eth', '')
      
      if (!/^[a-z0-9\-]+$/.test(cleanDomain) || cleanDomain.length < 3) {
        return {
          available: false,
          onChain: false,
          reason: 'Invalid domain format. Must be 3+ characters, lowercase letters, numbers, and hyphens only.'
        }
      }

      // For local development, simulate ENS availability
      if (this.currentNetwork === 'local') {
        return await this.checkLocalDomainAvailability(cleanDomain)
      }

      // Check actual ENS blockchain availability
      return await this.checkBlockchainAvailability(cleanDomain)

    } catch (error) {
      logger.error('Domain availability check failed:', {
        domain: domainName,
        error: error.message,
        stack: error.stack
      })

      return {
        available: false,
        onChain: false,
        reason: 'Error checking domain availability'
      }
    }
  }

  /**
   * Check domain availability on actual Ethereum blockchain
   */
  async checkBlockchainAvailability(domainName) {
    try {
      if (!this.baseRegistrar || !this.provider) {
        return {
          available: false,
          onChain: false,
          reason: 'ENS contracts not available'
        }
      }

      // Convert domain name to token ID (keccak256 hash)
      const tokenId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(domainName))
      
      logger.info(`Checking ENS availability for ${domainName} (${tokenId})`)

      // Check if available using Base Registrar
      const available = await this.baseRegistrar.available(tokenId)

      // Double-check by looking at ENS Registry owner
      const fullDomain = `${domainName}.eth`
      const namehash = ethers.utils.namehash(fullDomain)
      const owner = await this.ensRegistry.owner(namehash)
      const isOwned = owner !== '0x0000000000000000000000000000000000000000'

      logger.info(`ENS check results for ${domainName}:`, {
        availableFromRegistrar: available,
        ownerFromRegistry: owner,
        isOwned: isOwned
      })

      return {
        available: available && !isOwned,
        onChain: true,
        reason: available && !isOwned ? 'Domain is available' : 'Domain is already registered'
      }

    } catch (error) {
      logger.error('Blockchain availability check failed:', error.message)
      
      // If blockchain check fails, we can't be sure
      return {
        available: false,
        onChain: false,
        reason: 'Unable to verify on blockchain'
      }
    }
  }

  /**
   * For local development - simulate ENS checking with realistic data
   */
  async checkLocalDomainAvailability(domainName) {
    // Simulate realistic ENS domain registrations - these are very likely taken on real ENS
    const takenDomains = [
      // Major companies and brands
      'google', 'apple', 'microsoft', 'amazon', 'facebook', 'meta', 'twitter', 'tesla', 'netflix', 'uber',
      'airbnb', 'spotify', 'adobe', 'samsung', 'sony', 'nvidia', 'intel', 'ibm', 'oracle', 'salesforce',
      
      // Crypto/Web3 related 
      'ethereum', 'bitcoin', 'metamask', 'uniswap', 'opensea', 'coinbase', 'binance', 'solana', 'polygon',
      'chainlink', 'aave', 'compound', 'maker', 'sushi', 'pancake', 'curve', 'yearn', 'synthetix',
      
      // Common words and terms
      'crypto', 'defi', 'nft', 'web3', 'blockchain', 'dao', 'token', 'coin', 'wallet', 'exchange',
      'finance', 'money', 'bank', 'payment', 'trade', 'swap', 'stake', 'yield', 'farm', 'pool',
      
      // Generic/common names
      'test', 'demo', 'example', 'sample', 'app', 'dapp', 'protocol', 'network', 'platform', 'service',
      'api', 'bot', 'ai', 'ml', 'data', 'cloud', 'tech', 'digital', 'online', 'global', 'international',
      
      // Short/premium domains (3-4 chars)
      'eth', 'btc', 'nft', 'dao', 'web', 'app', 'api', 'dev', 'pro', 'vip', 'bot', 'lab', 'hub', 'org',
      
      // Names that would definitely be taken
      'admin', 'root', 'www', 'mail', 'email', 'support', 'help', 'info', 'news', 'blog', 'shop', 'store'
    ]
    
    const available = !takenDomains.includes(domainName.toLowerCase())
    
    logger.info(`Local ENS simulation for ${domainName}: ${available ? 'available' : 'taken'}`)
    
    return {
      available,
      onChain: false, // Simulated, not real blockchain
      reason: available 
        ? 'Domain appears available (local simulation)' 
        : 'Domain is taken (local simulation - likely registered on real ENS)'
    }
  }

  /**
   * Get ENS domain price (for future use)
   */
  async getDomainPrice(domainName, duration = 365) {
    // This would integrate with ETH Registrar Controller
    // For now, return a placeholder
    return {
      price: '0.005', // ETH
      duration: duration,
      currency: 'ETH'
    }
  }

  /**
   * Register ENS domain on testnet (Sepolia)
   * This is the REAL domain purchase function
   */
  async registerDomainOnTestnet(domainName, ownerAddress, duration = 365) {
    try {
      logger.info(`Attempting to register ${domainName}.eth for ${ownerAddress} on testnet`)

      // For local/development, simulate successful registration
      if (this.currentNetwork === 'local') {
        logger.info(`Simulating ENS registration for ${domainName}.eth (local development)`)
        
        // Simulate registration delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        return {
          success: true,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`, // Mock hash
          domain: `${domainName}.eth`,
          owner: ownerAddress,
          duration: duration,
          network: 'local-simulation',
          cost: '0.005 ETH (simulated)'
        }
      }

      // For testnet (Sepolia), implement real registration
      if (this.currentNetwork === 'sepolia') {
        const controllerContract = new ethers.Contract(
          this.contracts.ETH_REGISTRAR_CONTROLLER,
          [
            // Minimal ABI for registration
            {
              "inputs": [
                {"name": "name", "type": "string"},
                {"name": "owner", "type": "address"},
                {"name": "duration", "type": "uint256"},
                {"name": "secret", "type": "bytes32"},
                {"name": "resolver", "type": "address"},
                {"name": "data", "type": "bytes[]"},
                {"name": "reverseRecord", "type": "bool"},
                {"name": "fuses", "type": "uint16"}
              ],
              "name": "register",
              "type": "function"
            },
            {
              "inputs": [{"name": "name", "type": "string"}, {"name": "duration", "type": "uint256"}],
              "name": "rentPrice",
              "type": "function",
              "outputs": [{"name": "price", "type": "uint256"}]
            }
          ],
          this.provider
        )

        // Get price
        const price = await controllerContract.rentPrice(domainName, duration)
        
        // Note: This requires a wallet with ETH for gas and registration fees
        // In a real implementation, this would need a signer with testnet ETH
        logger.warn('Real testnet registration requires wallet integration and testnet ETH')
        
        return {
          success: false,
          error: 'Testnet registration requires wallet integration',
          estimatedPrice: ethers.utils.formatEther(price),
          network: 'sepolia'
        }
      }

      throw new Error(`ENS registration not implemented for network: ${this.currentNetwork}`)

    } catch (error) {
      logger.error(`ENS registration failed for ${domainName}:`, error.message)
      return {
        success: false,
        error: error.message,
        domain: `${domainName}.eth`
      }
    }
  }

  /**
   * Switch network (for testing purposes)
   */
  switchNetwork(network) {
    if (this.providers[network]) {
      this.currentNetwork = network
      this.provider = this.providers[network]
      this.contracts = ENS_CONTRACTS[network.toUpperCase()]
      this.initializeContracts()
      logger.info(`Switched to ${network} network`)
    } else {
      throw new Error(`Network ${network} not supported`)
    }
  }
}

module.exports = ENSService
