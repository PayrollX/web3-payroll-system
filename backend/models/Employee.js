const mongoose = require('mongoose')

/**
 * Web3 Employee Model - Ultra Minimal
 * ONLY name + ENS + wallet + salary
 * NO personal data, NO tracking
 */

const employeeSchema = new mongoose.Schema({
  // Company reference
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Employee name (for ENS generation only)
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  // ENS subdomain (auto-generated from name)
  ensName: {
    type: String,
    lowercase: true
  },
  
  // Wallet for payments (essential for payroll)
  walletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  
  // Salary amount (for payroll)
  salaryAmount: {
    type: String,
    required: true,
    default: '0'
  },
  
  // Payment token
  paymentToken: {
    type: String,
    enum: ['ETH', 'USDC', 'USDT', 'DAI'],
    default: 'ETH'
  }

}, {
  timestamps: false, // No tracking
  versionKey: false  // No version tracking
})

// Essential indexes only
employeeSchema.index({ companyId: 1, ensName: 1 }, { unique: true })
employeeSchema.index({ walletAddress: 1 })

// Generate ENS name from employee name
employeeSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.ensName = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)
  }
  next()
})

// Essential methods only
employeeSchema.statics.findByCompany = function(companyId) {
  return this.find({ companyId })
}

employeeSchema.statics.findByWallet = function(wallet) {
  return this.findOne({ walletAddress: wallet.toLowerCase() })
}

module.exports = mongoose.model('Employee', employeeSchema)