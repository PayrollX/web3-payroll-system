const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const Company = require('../models/Company')
const { ethers } = require('ethers')
const winston = require('winston')

/**
 * Employee routes for Web3 Payroll System
 * @author Dev Austin
 */

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/employees.log' }),
  ]
})

// Middleware to extract wallet address and get company
const extractCompanyFromWallet = async (req, res, next) => {
  try {
    const walletAddress = req.headers['x-wallet-address']
    
    if (!walletAddress) {
      return res.status(401).json({
        error: 'Wallet address required',
        message: 'Please provide wallet address in x-wallet-address header'
      })
    }
    
    if (!ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      })
    }

    const company = await Company.findByWallet(walletAddress.toLowerCase())
    
    if (!company) {
      return res.status(404).json({
        error: 'Company not found',
        message: 'Please register your company first'
      })
    }

    req.company = company
    req.walletAddress = walletAddress.toLowerCase()
    next()
  } catch (error) {
    logger.error('Company extraction failed', { error: error.message })
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Get all employees for the authenticated company
router.get('/', extractCompanyFromWallet, async (req, res) => {
  try {
    // Disable caching to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    const { page = 1, limit = 10 } = req.query
    
    // Filter by company
    let query = { companyId: req.company._id }

    const employees = await Employee.find(query)
      .populate('companyId', 'name ensDomain')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ _id: -1 })

    const total = await Employee.countDocuments(query)

    // Transform to match frontend expectations
    const transformedEmployees = employees.map(emp => ({
      _id: emp._id,
      personalInfo: {
        name: emp.name,
        email: `${emp.ensName}@${emp.companyId?.ensDomain || 'company.eth'}`,
      },
      employmentDetails: {
        isActive: true, // All employees are active in minimal model
        position: 'Employee',
        department: 'General'
      },
      payrollSettings: {
        walletAddress: emp.walletAddress,
        salaryAmount: emp.salaryAmount,
        paymentFrequency: emp.paymentToken === 'ETH' ? 'MONTHLY' : 'MONTHLY',
        preferredToken: emp.paymentToken
      },
      ensDetails: {
        subdomain: emp.ensName,
        fullDomain: `${emp.ensName}.${emp.companyId?.ensDomain || 'company.eth'}`
      }
    }))

    res.json({
      success: true,
      data: {
        employees: transformedEmployees,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch employees',
      message: error.message 
    })
  }
})

// Get employee by ID
router.get('/:id', extractCompanyFromWallet, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employee by wallet address
router.get('/wallet/:address', async (req, res) => {
  try {
    const employee = await Employee.findOne({ walletAddress: req.params.address.toLowerCase() })
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employee by ENS subdomain
router.get('/ens/:subdomain', async (req, res) => {
  try {
    const employee = await Employee.findOne({ ensName: req.params.subdomain.toLowerCase() })
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new employee
router.post('/', extractCompanyFromWallet, async (req, res) => {
  try {
    // Handle both flat and nested data structures
    let name, walletAddress, salaryAmount, paymentToken = 'ETH'
    
    if (req.body.personalInfo) {
      // Nested structure from frontend
      name = req.body.personalInfo.name
      walletAddress = req.body.payrollSettings?.walletAddress
      salaryAmount = req.body.payrollSettings?.salaryAmount
      paymentToken = req.body.payrollSettings?.preferredToken || 'ETH'
    } else {
      // Flat structure for direct API calls
      name = req.body.name
      walletAddress = req.body.walletAddress
      salaryAmount = req.body.salaryAmount
      paymentToken = req.body.paymentToken || 'ETH'
    }

    // Validate required fields
    if (!name || !walletAddress || !salaryAmount) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'walletAddress', 'salaryAmount']
      })
    }

    // Validate wallet address
    if (!ethers.utils.isAddress(walletAddress)) {
      return res.status(400).json({
        error: 'Invalid wallet address'
      })
    }

    // Check if wallet already exists
    const existingEmployee = await Employee.findOne({ walletAddress: walletAddress.toLowerCase() })
    if (existingEmployee) {
      return res.status(409).json({
        error: 'Wallet address already in use',
        message: 'An employee with this wallet address already exists'
      })
    }

    // Create employee data (minimal)
    const employeeData = {
      companyId: req.company._id,
      name: name.trim(),
      walletAddress: walletAddress.toLowerCase(),
      salaryAmount: salaryAmount.toString(),
      paymentToken: paymentToken
    }

    const employee = new Employee(employeeData)
    await employee.save()

    logger.info('Employee created successfully', {
      companyId: req.company._id,
      employeeId: employee._id,
      employeeName: name,
      createdBy: req.walletAddress
    })

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        ensName: employee.ensName,
        walletAddress: employee.walletAddress,
        salaryAmount: employee.salaryAmount,
        paymentToken: employee.paymentToken,
        ensDomain: `${employee.ensName}.${req.company.ensDomain}`
      }
    })
  } catch (error) {
    logger.error('Employee creation failed', {
      error: error.message,
      companyId: req.company?._id,
      walletAddress: req.walletAddress
    })

    if (error.code === 11000) {
      // Handle duplicate key errors
      if (error.keyPattern && error.keyPattern['payrollSettings.walletAddress']) {
        return res.status(409).json({ 
          error: 'Wallet address already in use',
          message: 'An employee with this wallet address already exists'
        })
      }
      if (error.keyPattern && error.keyPattern['personalInfo.email']) {
        return res.status(409).json({ 
          error: 'Email already in use',
          message: 'An employee with this email already exists in your company'
        })
      }
      return res.status(409).json({ 
        error: 'Duplicate entry',
        message: 'Employee with this information already exists'
      })
    }

    res.status(500).json({ 
      error: 'Employee creation failed',
      message: 'An error occurred while creating the employee'
    })
  }
})

// Delete employee
router.delete('/:id', extractCompanyFromWallet, async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ 
      _id: req.params.id, 
      companyId: req.company._id 
    })
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json({ 
      success: true,
      message: 'Employee deleted successfully' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

