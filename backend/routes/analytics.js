/**
 * Analytics routes for Web3 Payroll System
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

// Get payroll summary analytics
router.get('/payroll-summary', extractCompanyFromWallet, async (req, res) => {
  try {
    // Disable caching to prevent 304 responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
    
    // Get basic employee counts for this company
    const totalEmployees = await Employee.countDocuments({ companyId: req.company._id })
    const activeEmployees = totalEmployees // All employees are active in minimal model
    
    // Get all employees for this company
    const employees = await Employee.find({ companyId: req.company._id })
    
    // Calculate total and monthly payroll amounts
    let totalPayrollAmount = 0
    let monthlyPayrollAmount = 0
    
    employees.forEach(emp => {
      const salary = parseFloat(emp.salaryAmount) || 0
      totalPayrollAmount += salary
      
      // For minimal model, assume monthly payments for simplicity
      monthlyPayrollAmount += salary
    })
    
    // Department breakdown (simplified for minimal model)
    const departmentBreakdown = [
      {
        department: 'General',
        employeeCount: totalEmployees,
        totalSalary: totalPayrollAmount.toString()
      }
    ]
    
    // Mock payment trends (last 6 months)
    const paymentTrends = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      paymentTrends.push({
        month: month.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        amount: (monthlyPayrollAmount * (0.8 + Math.random() * 0.4)).toFixed(4),
        count: Math.floor(activeEmployees * (0.8 + Math.random() * 0.4))
      })
    }
    
    // Mock token usage
    const tokenUsage = [
      {
        token: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        amount: (totalPayrollAmount * 0.7).toFixed(4),
        percentage: 70
      },
      {
        token: '0xA0b86a33E6e527e1F8A4E84F57FB1e8A84eB8aEd',
        symbol: 'USDC',
        amount: (totalPayrollAmount * 0.2).toFixed(4),
        percentage: 20
      },
      {
        token: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        amount: (totalPayrollAmount * 0.1).toFixed(4),
        percentage: 10
      }
    ]
    
    res.json({
      totalEmployees,
      activeEmployees,
      totalPayrollAmount: totalPayrollAmount.toFixed(4),
      monthlyPayrollAmount: monthlyPayrollAmount.toFixed(4),
      pendingPayments: 0, // Would be calculated from blockchain data
      completedPayments: 0, // Would come from payment history
      totalBonuses: '0.0000', // Would come from bonus system
      monthlyBonuses: '0.0000', // Would come from bonus system
      departmentBreakdown,
      paymentTrends,
      tokenUsage
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employee cost analysis
router.get('/employee-costs', extractCompanyFromWallet, async (req, res) => {
  try {
    const employees = await Employee.find({ companyId: req.company._id })
    
    const costAnalysis = employees.map(emp => {
      const monthlySalary = parseFloat(emp.salaryAmount) || 0
      let annualCost = 0
      
      // For minimal model, assume monthly payments
      annualCost = monthlySalary * 12
      
      return {
        employeeId: emp._id,
        name: emp.name,
        position: 'Employee',
        department: 'General',
        monthlyCost: monthlySalary.toFixed(4),
        annualCost: annualCost.toFixed(4),
        paymentFrequency: 'MONTHLY',
        preferredToken: emp.paymentToken,
        ensName: emp.ensName,
        ensDomain: `${emp.ensName}.${req.company.ensDomain}`
      }
    })
    
    // Sort by annual cost (highest first)
    costAnalysis.sort((a, b) => parseFloat(b.annualCost) - parseFloat(a.annualCost))
    
    // Calculate totals
    const totalMonthlyCost = costAnalysis.reduce((sum, emp) => sum + parseFloat(emp.monthlyCost), 0)
    const totalAnnualCost = costAnalysis.reduce((sum, emp) => sum + parseFloat(emp.annualCost), 0)
    
    res.json({
      employees: costAnalysis,
      totals: {
        totalMonthlyCost: totalMonthlyCost.toFixed(4),
        totalAnnualCost: totalAnnualCost.toFixed(4),
        averageMonthlyCost: (totalMonthlyCost / costAnalysis.length).toFixed(4),
        averageAnnualCost: (totalAnnualCost / costAnalysis.length).toFixed(4)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get payment trends
router.get('/payment-trends', extractCompanyFromWallet, async (req, res) => {
  try {
    const { startDate, endDate, period = 'monthly' } = req.query
    
    // Mock payment trends data
    const trends = []
    const now = new Date()
    let periodsToShow = 12 // Default to 12 months
    
    if (period === 'daily') {
      periodsToShow = 30 // 30 days
    } else if (period === 'weekly') {
      periodsToShow = 12 // 12 weeks
    }
    
    for (let i = periodsToShow - 1; i >= 0; i--) {
      let date
      let label
      
      if (period === 'daily') {
        date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (period === 'weekly') {
        date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7))
        label = `Week ${Math.floor(i / 7) + 1}`
      } else {
        date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      }
      
      trends.push({
        period: label,
        date: date.toISOString(),
        totalAmount: (Math.random() * 100 + 50).toFixed(4),
        paymentCount: Math.floor(Math.random() * 20 + 5),
        averagePayment: (Math.random() * 5 + 1).toFixed(4),
        ethAmount: (Math.random() * 70 + 30).toFixed(4),
        tokenAmount: (Math.random() * 30 + 10).toFixed(4)
      })
    }
    
    res.json({
      trends,
      period,
      summary: {
        totalPayments: trends.reduce((sum, t) => sum + parseInt(t.paymentCount), 0),
        totalAmount: trends.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0).toFixed(4),
        averagePerPeriod: (trends.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0) / trends.length).toFixed(4)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get department analytics
router.get('/departments', extractCompanyFromWallet, async (req, res) => {
  try {
    const departmentData = await Employee.aggregate([
      { $match: { 'employmentDetails.isActive': true } },
      {
        $group: {
          _id: '$employmentDetails.department',
          employeeCount: { $sum: 1 },
          totalSalary: { $sum: { $toDouble: '$payrollSettings.salaryAmount' } },
          avgSalary: { $avg: { $toDouble: '$payrollSettings.salaryAmount' } },
          employees: { 
            $push: {
              name: '$personalInfo.name',
              position: '$employmentDetails.position',
              salary: '$payrollSettings.salaryAmount'
            }
          }
        }
      },
      {
        $project: {
          department: '$_id',
          employeeCount: 1,
          totalSalary: { $toString: '$totalSalary' },
          avgSalary: { $toString: '$avgSalary' },
          employees: 1,
          _id: 0
        }
      },
      { $sort: { employeeCount: -1 } }
    ])
    
    // Calculate percentages
    const totalEmployees = await Employee.countDocuments({ 'employmentDetails.isActive': true })
    const enrichedData = departmentData.map(dept => ({
      ...dept,
      percentage: ((dept.employeeCount / totalEmployees) * 100).toFixed(1)
    }))
    
    res.json({
      departments: enrichedData,
      totalDepartments: enrichedData.length,
      totalEmployees
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

