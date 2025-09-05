/**
 * Payroll routes for Web3 Payroll System
 * @author Dev Austin
 */

const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const Company = require('../models/Company')
const { ethers } = require('ethers')

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
    res.status(500).json({ error: 'Authentication failed' })
  }
}

// Get payment history
router.get('/history', extractCompanyFromWallet, async (req, res) => {
  try {
    // Disable caching to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    const { employeeId, page = 1, limit = 10, startDate, endDate } = req.query
    
    let query = {}
    if (employeeId) {
      query.employeeId = employeeId
    }
    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    // Mock payment history for now
    // In a real implementation, you'd have a separate PaymentHistory model
    const payments = []
    
    res.json({
      data: payments,
      totalPages: Math.ceil(payments.length / limit),
      currentPage: parseInt(page),
      total: payments.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get pending payments
router.get('/pending', extractCompanyFromWallet, async (req, res) => {
  try {
    // Disable caching to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    const employees = await Employee.find({ companyId: req.company._id })
    
    // For minimal model, assume all employees have pending payments
    // Transform to match expected format
    const pendingPayments = employees.map(employee => ({
      _id: employee._id,
      name: employee.name,
      walletAddress: employee.walletAddress,
      salaryAmount: employee.salaryAmount,
      paymentToken: employee.paymentToken,
      ensName: employee.ensName,
      ensDomain: `${employee.ensName}.${req.company.ensDomain}`,
      dueDate: new Date().toISOString(),
      isPending: true
    }))

    res.json(pendingPayments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Process payroll for multiple employees
router.post('/process', extractCompanyFromWallet, async (req, res) => {
  try {
    const { employeeIds } = req.body
    
    // This is where you'd integrate with the blockchain service
    // For now, we'll just return a mock response
    
    const mockTransactionHash = '0x' + Math.random().toString(16).slice(2, 66)
    
    // Update last payment timestamps for employees
    await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { 'payrollSettings.lastPaymentTimestamp': Date.now() }
    )
    
    res.json({
      success: true,
      transactionHash: mockTransactionHash,
      message: `Payroll processed for ${employeeIds.length} employees`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Process individual payment
router.post('/process/:employeeId', extractCompanyFromWallet, async (req, res) => {
  try {
    const { employeeId } = req.params
    
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    
    if (!employee.employmentDetails.isActive) {
      return res.status(400).json({ error: 'Employee is not active' })
    }
    
    // This is where you'd integrate with the blockchain service
    const mockTransactionHash = '0x' + Math.random().toString(16).slice(2, 66)
    
    // Update last payment timestamp
    employee.payrollSettings.lastPaymentTimestamp = Date.now()
    await employee.save()
    
    res.json({
      success: true,
      transactionHash: mockTransactionHash,
      message: `Payment processed for ${employee.personalInfo.name}`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get payroll summary
router.get('/summary', extractCompanyFromWallet, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ companyId: req.company._id })
    
    // Calculate total monthly payroll
    const employees = await Employee.find({ companyId: req.company._id })
    const totalMonthlyPayroll = employees.reduce((sum, emp) => {
      const salary = parseFloat(emp.salaryAmount) || 0
      // For minimal model, assume monthly payments
      return sum + salary
    }, 0)
    
    res.json({
      totalEmployees,
      totalMonthlyPayroll: totalMonthlyPayroll.toFixed(4),
      pendingPayments: 0, // This would be calculated from blockchain data
      totalPaymentsProcessed: 0 // This would come from payment history
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
