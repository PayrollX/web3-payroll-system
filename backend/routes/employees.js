const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const { validateEmployee, validateUpdateEmployee } = require('../middleware/validation')
const authMiddleware = require('../middleware/auth')

/**
 * Employee routes for Web3 Payroll System
 * @author Dev Austin
 */

// Get all employees
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { department, active, page = 1, limit = 10 } = req.query
    
    let query = {}
    if (department) {
      query['employmentDetails.department'] = department
    }
    if (active !== undefined) {
      query['employmentDetails.isActive'] = active === 'true'
    }

    const employees = await Employee.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Employee.countDocuments(query)

    res.json({
      employees,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employee by ID
router.get('/:id', authMiddleware, async (req, res) => {
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
router.get('/wallet/:address', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findByWalletAddress(req.params.address)
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employee by ENS subdomain
router.get('/ens/:subdomain', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findByENSSubdomain(req.params.subdomain)
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new employee
router.post('/', authMiddleware, validateEmployee, async (req, res) => {
  try {
    const employeeData = {
      ...req.body,
      createdBy: req.user.address,
      updatedBy: req.user.address
    }

    const employee = new Employee(employeeData)
    await employee.save()

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    })
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ 
        error: 'Employee with this wallet address or email already exists' 
      })
    } else {
      res.status(500).json({ error: error.message })
    }
  }
})

// Update employee
router.put('/:id', authMiddleware, validateUpdateEmployee, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        updatedBy: req.user.address 
      },
      { new: true, runValidators: true }
    )

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json({
      message: 'Employee updated successfully',
      employee
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Deactivate employee
router.patch('/:id/deactivate', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        'employmentDetails.isActive': false,
        updatedBy: req.user.address 
      },
      { new: true }
    )

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json({
      message: 'Employee deactivated successfully',
      employee
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Activate employee
router.patch('/:id/activate', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { 
        'employmentDetails.isActive': true,
        updatedBy: req.user.address 
      },
      { new: true }
    )

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json({
      message: 'Employee activated successfully',
      employee
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete employee
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id)
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    res.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employees with pending payments
router.get('/pending-payments/list', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.findActiveEmployees()
    const pendingEmployees = employees.filter(emp => emp.isPaymentDue())

    res.json({
      employees: pendingEmployees,
      count: pendingEmployees.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update employee payment timestamp
router.patch('/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { timestamp } = req.body
    const employee = await Employee.findById(req.params.id)
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }

    await employee.updateLastPayment(timestamp)

    res.json({
      message: 'Payment timestamp updated successfully',
      employee
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get employee statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments()
    const activeEmployees = await Employee.countDocuments({ 'employmentDetails.isActive': true })
    const pendingPayments = await Employee.findActiveEmployees()
    const pendingCount = pendingPayments.filter(emp => emp.isPaymentDue()).length

    // Department breakdown
    const departmentStats = await Employee.aggregate([
      { $match: { 'employmentDetails.isActive': true } },
      { $group: { _id: '$employmentDetails.department', count: { $sum: 1 } } }
    ])

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      pendingPayments: pendingCount,
      departmentBreakdown: departmentStats
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

