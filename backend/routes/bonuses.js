/**
 * Bonus routes for Web3 Payroll System
 * @author Dev Austin
 */

const express = require('express')
const router = express.Router()
const Employee = require('../models/Employee')
const authMiddleware = require('../middleware/auth')
const { validateBonus } = require('../middleware/validation')

// Mock bonus storage (in a real app, you'd have a Bonus model)
let bonuses = []
let bonusIdCounter = 1

// Get all bonuses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, status, page = 1, limit = 10 } = req.query
    
    let filteredBonuses = bonuses
    
    if (employeeId) {
      filteredBonuses = filteredBonuses.filter(bonus => bonus.employeeId === employeeId)
    }
    
    if (status) {
      filteredBonuses = filteredBonuses.filter(bonus => bonus.status === status)
    }
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const paginatedBonuses = filteredBonuses.slice(startIndex, endIndex)
    
    res.json({
      data: paginatedBonuses,
      totalPages: Math.ceil(filteredBonuses.length / limit),
      currentPage: parseInt(page),
      total: filteredBonuses.length
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get bonus by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bonus = bonuses.find(b => b._id === req.params.id)
    if (!bonus) {
      return res.status(404).json({ error: 'Bonus not found' })
    }
    res.json(bonus)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new bonus
router.post('/', authMiddleware, validateBonus, async (req, res) => {
  try {
    const { employeeId, amount, reason, tokenAddress } = req.body
    
    // Verify employee exists
    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' })
    }
    
    const newBonus = {
      _id: bonusIdCounter.toString(),
      employeeId,
      employeeName: employee.personalInfo.name,
      amount,
      tokenAddress,
      tokenSymbol: tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'TOKEN',
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: req.user.address
    }
    
    bonuses.push(newBonus)
    bonusIdCounter++
    
    res.status(201).json({
      message: 'Bonus created successfully',
      bonus: newBonus
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update bonus
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const bonusIndex = bonuses.findIndex(b => b._id === req.params.id)
    if (bonusIndex === -1) {
      return res.status(404).json({ error: 'Bonus not found' })
    }
    
    const updatedBonus = {
      ...bonuses[bonusIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.address
    }
    
    bonuses[bonusIndex] = updatedBonus
    
    res.json({
      message: 'Bonus updated successfully',
      bonus: updatedBonus
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Distribute bonus
router.post('/:id/distribute', authMiddleware, async (req, res) => {
  try {
    const bonusIndex = bonuses.findIndex(b => b._id === req.params.id)
    if (bonusIndex === -1) {
      return res.status(404).json({ error: 'Bonus not found' })
    }
    
    const bonus = bonuses[bonusIndex]
    if (bonus.status === 'distributed') {
      return res.status(400).json({ error: 'Bonus already distributed' })
    }
    
    // This is where you'd integrate with the blockchain service
    const mockTransactionHash = '0x' + Math.random().toString(16).slice(2, 66)
    
    bonus.status = 'distributed'
    bonus.transactionHash = mockTransactionHash
    bonus.distributionDate = new Date().toISOString()
    bonus.distributedBy = req.user.address
    
    res.json({
      success: true,
      transactionHash: mockTransactionHash,
      message: 'Bonus distributed successfully'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Bulk bonus distribution
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { bonusIds } = req.body
    
    if (!Array.isArray(bonusIds) || bonusIds.length === 0) {
      return res.status(400).json({ error: 'Invalid bonus IDs' })
    }
    
    const distributedBonuses = []
    const mockTransactionHash = '0x' + Math.random().toString(16).slice(2, 66)
    
    for (const bonusId of bonusIds) {
      const bonusIndex = bonuses.findIndex(b => b._id === bonusId)
      if (bonusIndex !== -1 && bonuses[bonusIndex].status === 'pending') {
        bonuses[bonusIndex].status = 'distributed'
        bonuses[bonusIndex].transactionHash = mockTransactionHash
        bonuses[bonusIndex].distributionDate = new Date().toISOString()
        bonuses[bonusIndex].distributedBy = req.user.address
        distributedBonuses.push(bonuses[bonusIndex])
      }
    }
    
    res.json({
      success: true,
      transactionHash: mockTransactionHash,
      distributedCount: distributedBonuses.length,
      message: `${distributedBonuses.length} bonuses distributed successfully`
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete bonus
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bonusIndex = bonuses.findIndex(b => b._id === req.params.id)
    if (bonusIndex === -1) {
      return res.status(404).json({ error: 'Bonus not found' })
    }
    
    const bonus = bonuses[bonusIndex]
    if (bonus.status === 'distributed') {
      return res.status(400).json({ error: 'Cannot delete distributed bonus' })
    }
    
    bonuses.splice(bonusIndex, 1)
    
    res.json({ message: 'Bonus deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get bonus statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const totalBonuses = bonuses.length
    const pendingBonuses = bonuses.filter(b => b.status === 'pending').length
    const distributedBonuses = bonuses.filter(b => b.status === 'distributed').length
    
    const totalBonusAmount = bonuses
      .filter(b => b.status === 'distributed')
      .reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0)
    
    const monthlyBonusAmount = bonuses
      .filter(b => {
        const distributionDate = new Date(b.distributionDate)
        const now = new Date()
        return b.status === 'distributed' && 
               distributionDate.getMonth() === now.getMonth() &&
               distributionDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, bonus) => sum + parseFloat(bonus.amount), 0)
    
    res.json({
      totalBonuses,
      pendingBonuses,
      distributedBonuses,
      totalBonusAmount: totalBonusAmount.toFixed(4),
      monthlyBonusAmount: monthlyBonusAmount.toFixed(4)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

