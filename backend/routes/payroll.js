/**
 * Payroll routes for Web3 Payroll System
 * @author Dev Austin
 */

const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const authMiddleware = require('../middleware/auth')
const { validatePayrollData } = require('../middleware/validation')

// Get payment history
router.get('/history', authMiddleware, async (req, res) => {
  try {
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
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find({ 'employmentDetails.isActive': true })
    
    // Filter employees who are due for payment
    const pendingPayments = employees.filter(employee => {
      // This is a simplified check - in reality you'd check against blockchain data
      const lastPayment = employee.payrollSettings.lastPaymentTimestamp || 0
      const now = Date.now()
      const daysSinceLastPayment = (now - lastPayment) / (1000 * 60 * 60 * 24)
      
      // Check based on payment frequency
      switch (employee.payrollSettings.paymentFrequency) {
        case 'WEEKLY':
          return daysSinceLastPayment >= 7
        case 'BIWEEKLY':
          return daysSinceLastPayment >= 14
        case 'MONTHLY':
          return daysSinceLastPayment >= 30
        case 'QUARTERLY':
          return daysSinceLastPayment >= 90
        default:
          return daysSinceLastPayment >= 30
      }
    })

    res.json(pendingPayments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Process payroll for multiple employees
router.post('/process', authMiddleware, validatePayrollData, async (req, res) => {
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
router.post('/process/:employeeId', authMiddleware, async (req, res) => {
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
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ 'employmentDetails.isActive': true })
    
    // Calculate total monthly payroll
    const employees = await Employee.find({ 'employmentDetails.isActive': true })
    const totalMonthlyPayroll = employees.reduce((sum, emp) => {
      const salary = parseFloat(emp.payrollSettings.salaryAmount) || 0
      // Convert based on frequency to monthly equivalent
      switch (emp.payrollSettings.paymentFrequency) {
        case 'WEEKLY':
          return sum + (salary * 4.33) // ~4.33 weeks per month
        case 'BIWEEKLY':
          return sum + (salary * 2.17) // ~2.17 biweeks per month
        case 'MONTHLY':
          return sum + salary
        case 'QUARTERLY':
          return sum + (salary / 3) // 1/3 of quarterly per month
        default:
          return sum + salary
      }
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
