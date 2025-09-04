/**
 * ENS routes for Web3 Payroll System
 * @author Dev Austin
 */

const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const authMiddleware = require('../middleware/auth')
const { validateENSRegistration } = require('../middleware/validation')

// Mock ENS registry (in a real app, you'd integrate with actual ENS contracts)
let ensRegistry = [
  {
    subdomain: 'company',
    fullDomain: 'company.eth',
    owner: '0x0000000000000000000000000000000000000000',
    resolver: '0x4976fb03C32e5B8cfe2b6Cb31c09Ba78EBaBa41',
    createdAt: new Date().toISOString()
  }
]

// Get company domains
router.get('/company-domains', authMiddleware, async (req, res) => {
  try {
    res.json(ensRegistry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Register ENS subdomain
router.post('/register', authMiddleware, validateENSRegistration, async (req, res) => {
  try {
    const { subdomain, employeeAddress, resolverAddress } = req.body
    
    // Check if subdomain already exists
    const existingDomain = ensRegistry.find(domain => domain.subdomain === subdomain)
    if (existingDomain) {
      return res.status(400).json({ error: 'Subdomain already exists' })
    }
    
    // Verify employee exists
    const employee = await Employee.findOne({ 'payrollSettings.walletAddress': employeeAddress })
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    
    // Create new ENS record
    const newDomain = {
      subdomain,
      fullDomain: `${subdomain}.company.eth`,
      owner: employeeAddress,
      resolver: resolverAddress || '0x4976fb03C32e5B8cfe2b6Cb31c09Ba78EBaBa41',
      createdAt: new Date().toISOString(),
      createdBy: req.user.address
    }
    
    ensRegistry.push(newDomain)
    
    // Update employee record
    employee.ensDetails.subdomain = subdomain
    employee.ensDetails.fullDomain = newDomain.fullDomain
    employee.ensDetails.resolverAddress = newDomain.resolver
    await employee.save()
    
    // Mock transaction hash
    const mockTransactionHash = '0x' + Math.random().toString(16).slice(2, 66)
    
    res.json({
      success: true,
      transactionHash: mockTransactionHash,
      domain: newDomain,
      message: 'ENS subdomain registered successfully'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Resolve ENS name
router.get('/resolve/:ensName', authMiddleware, async (req, res) => {
  try {
    const { ensName } = req.params
    
    // Find domain in registry
    const domain = ensRegistry.find(d => d.fullDomain === ensName || d.subdomain === ensName)
    
    if (!domain) {
      return res.status(404).json({ error: 'ENS name not found' })
    }
    
    res.json({
      address: domain.owner,
      domain: domain.fullDomain,
      resolver: domain.resolver
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Transfer ENS subdomain
router.post('/transfer', authMiddleware, async (req, res) => {
  try {
    const { subdomain, newOwner } = req.body
    
    // Find domain
    const domainIndex = ensRegistry.findIndex(d => d.subdomain === subdomain)
    if (domainIndex === -1) {
      return res.status(404).json({ error: 'Subdomain not found' })
    }
    
    // Validate new owner address
    if (!/^0x[a-fA-F0-9]{40}$/.test(newOwner)) {
      return res.status(400).json({ error: 'Invalid new owner address' })
    }
    
    // Update domain ownership
    ensRegistry[domainIndex].owner = newOwner
    ensRegistry[domainIndex].transferredAt = new Date().toISOString()
    ensRegistry[domainIndex].transferredBy = req.user.address
    
    // Mock transaction hash
    const mockTransactionHash = '0x' + Math.random().toString(16).slice(2, 66)
    
    res.json({
      success: true,
      transactionHash: mockTransactionHash,
      message: 'ENS subdomain transferred successfully'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get ENS subdomain details
router.get('/subdomain/:subdomain', authMiddleware, async (req, res) => {
  try {
    const { subdomain } = req.params
    
    const domain = ensRegistry.find(d => d.subdomain === subdomain)
    if (!domain) {
      return res.status(404).json({ error: 'Subdomain not found' })
    }
    
    // Get associated employee
    const employee = await Employee.findOne({ 'ensDetails.subdomain': subdomain })
    
    res.json({
      domain,
      employee: employee ? {
        name: employee.personalInfo.name,
        address: employee.payrollSettings.walletAddress,
        position: employee.employmentDetails.position,
        department: employee.employmentDetails.department
      } : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Check subdomain availability
router.get('/check/:subdomain', authMiddleware, async (req, res) => {
  try {
    const { subdomain } = req.params
    
    // Validate subdomain format
    if (!/^[a-z0-9\-]+$/.test(subdomain)) {
      return res.status(400).json({ 
        available: false,
        error: 'Invalid subdomain format' 
      })
    }
    
    if (subdomain.length < 3 || subdomain.length > 63) {
      return res.status(400).json({ 
        available: false,
        error: 'Subdomain must be between 3 and 63 characters' 
      })
    }
    
    const exists = ensRegistry.some(d => d.subdomain === subdomain)
    
    res.json({
      available: !exists,
      subdomain,
      fullDomain: `${subdomain}.company.eth`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get ENS statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const totalDomains = ensRegistry.length
    const employeeDomains = ensRegistry.filter(d => d.subdomain !== 'company').length
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentRegistrations = ensRegistry.filter(d => 
      new Date(d.createdAt) > thirtyDaysAgo
    ).length
    
    res.json({
      totalDomains,
      employeeDomains,
      companyDomains: totalDomains - employeeDomains,
      recentRegistrations
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

