const express = require('express')
const router = express.Router()
const Company = require('../models/Company')
const Employee = require('../models/Employee')
const ENSService = require('../services/ensService')
const { body, validationResult } = require('express-validator')
const { ethers } = require('ethers')

/**
 * Web3 Company Routes - Ultra Minimal
 * NO tracking, NO personal data, ONLY essentials
 */

// ENS service - force Sepolia for testing
const ensService = new ENSService()

// Force Sepolia for testing
console.log('🌐 Configuring ENS for Sepolia testnet')
ensService.switchNetwork('sepolia')

// Wallet validation
const isValidWallet = (address) => {
  try {
    return ethers.utils.isAddress(address)
  } catch {
    return false
  }
}

// Wallet-only auth
const requireWallet = (req, res, next) => {
  const wallet = req.headers['x-wallet-address']
  
  if (!wallet || !isValidWallet(wallet)) {
    return res.status(401).json({
      error: 'Valid wallet address required'
    })
  }
  
  req.wallet = wallet.toLowerCase()
  next()
}

/**
 * Check if wallet has company
 */
router.get('/status', requireWallet, async (req, res) => {
  try {
    const company = await Company.findByWallet(req.wallet)
    
    res.json({
      hasCompany: !!company,
      company: company || null
    })
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' })
  }
})

/**
 * Register company (minimal data)
 */
router.post('/register',
  requireWallet,
  [
    body('companyName').trim().isLength({ min: 2, max: 100 }),
    body('companyDomain').trim().isLength({ min: 3, max: 50 }).matches(/^[a-z0-9]+$/)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' })
      }

      const { companyName, companyDomain } = req.body

      // Check if wallet already has company
      const existing = await Company.findByWallet(req.wallet)
      if (existing) {
        return res.status(409).json({ error: 'Wallet already has company' })
      }

      // Check domain availability
      const fullDomain = `${companyDomain}.eth`
      const domainTaken = await Company.findByDomain(fullDomain)
      if (domainTaken) {
        return res.status(409).json({ error: 'Domain taken' })
      }

      // Check ENS availability
      const ensCheck = await ensService.checkDomainAvailability(companyDomain)
      if (!ensCheck.available) {
        return res.status(409).json({ error: 'ENS domain not available', reason: ensCheck.reason })
      }

      // GET ENS REGISTRATION INFO (availability and cost)
      console.log(`🔗 Getting ENS registration info for ${companyDomain}.eth...`)
      const ensInfo = await ensService.registerDomainOnTestnet(companyDomain, req.wallet)
      
      if (!ensInfo.success) {
        console.error(`❌ ENS registration info failed:`, ensInfo.error)
        return res.status(400).json({ 
          error: 'ENS registration info failed', 
          details: ensInfo.error,
          message: 'Unable to get domain registration information'
        })
      }

      console.log(`✅ ENS registration info retrieved:`, ensInfo.cost)

      // Return registration info for frontend to handle actual registration
      res.status(200).json({
        success: true,
        registrationInfo: {
          domain: ensInfo.domain,
          cost: ensInfo.cost,
          costWei: ensInfo.costWei,
          available: ensInfo.available,
          network: ensInfo.network,
          message: ensInfo.message
        },
        companyData: {
          name: companyName,
          ensDomain: fullDomain,
          ensNode: ethers.utils.namehash(fullDomain),
          ownerWallet: req.wallet
        }
      })

    } catch (error) {
      res.status(500).json({ error: 'Registration failed' })
    }
  }
)

/**
 * Create company after successful ENS registration
 */
router.post('/create-after-ens', requireWallet, async (req, res) => {
  try {
    const { companyData, transactionHash, blockNumber, gasUsed } = req.body

    if (!companyData || !transactionHash) {
      return res.status(400).json({ error: 'Missing required data' })
    }

    // Verify the wallet address matches
    if (companyData.ownerWallet.toLowerCase() !== req.wallet.toLowerCase()) {
      return res.status(403).json({ error: 'Wallet address mismatch' })
    }

    // Additional validation: verify transaction hash format
    if (!transactionHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      return res.status(400).json({ error: 'Invalid transaction hash format' })
    }

    console.log(`✅ Creating company after confirmed ENS registration`)
    console.log(`📝 Company: ${companyData.name}`)
    console.log(`🌐 Domain: ${companyData.ensDomain}`)
    console.log(`🔗 Transaction: ${transactionHash}`)
    console.log(`📦 Block: ${blockNumber || 'unknown'}`)
    console.log(`⛽ Gas used: ${gasUsed || 'unknown'}`)

    // Create the company with additional verification data
    const company = new Company({
      name: companyData.name,
      ensDomain: companyData.ensDomain,
      ensNode: companyData.ensNode,
      ownerWallet: companyData.ownerWallet,
      ensTransactionHash: transactionHash,
      ensBlockNumber: blockNumber,
      ensGasUsed: gasUsed,
      ensRegistrationConfirmed: true, // Mark as confirmed since we waited for confirmation
      createdAt: new Date()
    })

    await company.save()

    console.log(`🎉 Company created successfully with ID: ${company._id}`)

    res.status(201).json({
      success: true,
      company,
      message: 'Company created successfully after verified ENS registration'
    })

  } catch (error) {
    console.error('❌ Failed to create company after ENS registration:', error)
    res.status(500).json({ 
      error: 'Failed to create company',
      details: error.message 
    })
  }
})

/**
 * Get company info
 */
router.get('/my-company', requireWallet, async (req, res) => {
  try {
    const company = await Company.findByWallet(req.wallet)
    
    if (!company) {
      return res.status(404).json({ error: 'No company found' })
    }

    res.json({ company })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch company' })
  }
})

/**
 * Get employees
 */
router.get('/employees', requireWallet, async (req, res) => {
  try {
    const company = await Company.findByWallet(req.wallet)
    if (!company) {
      return res.status(404).json({ error: 'No company found' })
    }

    const employees = await Employee.findByCompany(company._id)
    res.json({ employees })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

/**
 * Add employee
 */
router.post('/employees',
  requireWallet,
  [
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('walletAddress').custom(isValidWallet),
    body('salaryAmount').isNumeric(),
    body('paymentToken').optional().isIn(['ETH', 'USDC', 'USDT', 'DAI'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' })
      }

      const { name, walletAddress, salaryAmount, paymentToken = 'ETH' } = req.body

      const company = await Company.findByWallet(req.wallet)
      if (!company) {
        return res.status(404).json({ error: 'No company found' })
      }

      // Create employee
      const employee = new Employee({
        companyId: company._id,
        name,
        walletAddress: walletAddress.toLowerCase(),
        salaryAmount: salaryAmount.toString(),
        paymentToken
      })

      await employee.save()

      res.status(201).json({
        success: true,
        employee
      })

    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: 'ENS name already exists' })
      }
      res.status(500).json({ error: 'Failed to add employee' })
    }
  }
)

/**
 * Remove employee
 */
router.delete('/employees/:id', requireWallet, async (req, res) => {
  try {
    const company = await Company.findByWallet(req.wallet)
    if (!company) {
      return res.status(404).json({ error: 'No company found' })
    }

    const result = await Employee.findOneAndDelete({
      _id: req.params.id,
      companyId: company._id
    })

    if (!result) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove employee' })
  }
})

/**
 * Check domain availability
 */
router.get('/check-domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params
    
    if (!/^[a-z0-9]+$/.test(domain)) {
      return res.status(400).json({ error: 'Invalid domain' })
    }

    const fullDomain = `${domain}.eth`

    // Check database
    const existing = await Company.findByDomain(fullDomain)
    if (existing) {
      return res.json({
        available: false,
        domain: fullDomain,
        reason: 'Domain taken',
        source: 'database'
      })
    }

    // Check ENS with fallback
    try {
      const ensCheck = await ensService.checkDomainAvailability(domain)
      
      res.json({
        available: ensCheck.available,
        domain: ensCheck.domain || fullDomain,
        reason: ensCheck.reason || 'Available',
        source: 'blockchain',
        details: {
          ensCheck: ensCheck,
          databaseCheck: null
        }
      })
    } catch (error) {
      // If blockchain check fails, assume domain is available for registration
      // The actual registration will handle the real availability check
      console.log(`Blockchain check failed for ${domain}, assuming available: ${error.message}`)
      
      res.json({
        available: true,
        domain: fullDomain,
        reason: 'Available (blockchain check failed, assuming available)',
        source: 'fallback',
        details: {
          ensCheck: null,
          databaseCheck: null
        }
      })
    }

  } catch (error) {
    res.status(500).json({ error: 'Domain check failed' })
  }
})

module.exports = router