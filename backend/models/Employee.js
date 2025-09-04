const mongoose = require('mongoose')

/**
 * Employee model for Web3 Payroll System
 * @author Dev Austin
 */

const employeeSchema = new mongoose.Schema({
  // Personal Information
  personalInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },

  // Employment Details
  employmentDetails: {
    startDate: { type: Date, required: true },
    position: { type: String, required: true },
    department: { type: String, required: true },
    employmentType: { 
      type: String, 
      enum: ['full-time', 'part-time', 'contractor'], 
      default: 'full-time' 
    },
    isActive: { type: Boolean, default: true }
  },

  // Payroll Settings
  payrollSettings: {
    walletAddress: { type: String, required: true, unique: true },
    salaryAmount: { type: String, required: true }, // Stored as string to handle large numbers
    paymentFrequency: { 
      type: String, 
      enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'], 
      default: 'MONTHLY' 
    },
    preferredToken: { type: String, required: true },
    lastPaymentTimestamp: { type: Number, default: 0 }
  },

  // ENS Details
  ensDetails: {
    subdomain: { type: String, required: true },
    fullDomain: { type: String, required: true },
    ensNode: { type: String, required: true },
    resolverAddress: { type: String }
  },

  // Tax Information
  taxInformation: {
    taxId: { type: String },
    withholdings: { type: Number, default: 0 },
    jurisdiction: { type: String },
    taxExempt: { type: Boolean, default: false }
  },

  // Blockchain Information
  blockchainInfo: {
    contractAddress: { type: String },
    transactionHash: { type: String },
    blockNumber: { type: Number },
    gasUsed: { type: Number }
  },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  updatedBy: { type: String }
}, {
  timestamps: true
})

// Indexes for better query performance
employeeSchema.index({ 'payrollSettings.walletAddress': 1 })
employeeSchema.index({ 'ensDetails.subdomain': 1 })
employeeSchema.index({ 'employmentDetails.department': 1 })
employeeSchema.index({ 'employmentDetails.isActive': 1 })
employeeSchema.index({ 'personalInfo.email': 1 })

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return this.personalInfo.name
})

// Virtual for ENS domain
employeeSchema.virtual('ensDomain').get(function() {
  return this.ensDetails.fullDomain
})

// Pre-save middleware
employeeSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// Static methods
employeeSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ 'payrollSettings.walletAddress': walletAddress })
}

employeeSchema.statics.findByENSSubdomain = function(subdomain) {
  return this.findOne({ 'ensDetails.subdomain': subdomain })
}

employeeSchema.statics.findActiveEmployees = function() {
  return this.find({ 'employmentDetails.isActive': true })
}

employeeSchema.statics.findByDepartment = function(department) {
  return this.find({ 'employmentDetails.department': department })
}

// Instance methods
employeeSchema.methods.isPaymentDue = function() {
  const now = Date.now()
  const lastPayment = this.payrollSettings.lastPaymentTimestamp
  const frequency = this.payrollSettings.paymentFrequency
  
  let interval
  switch (frequency) {
    case 'WEEKLY':
      interval = 7 * 24 * 60 * 60 * 1000 // 7 days
      break
    case 'BIWEEKLY':
      interval = 14 * 24 * 60 * 60 * 1000 // 14 days
      break
    case 'MONTHLY':
      interval = 30 * 24 * 60 * 60 * 1000 // 30 days
      break
    case 'QUARTERLY':
      interval = 90 * 24 * 60 * 60 * 1000 // 90 days
      break
    default:
      interval = 30 * 24 * 60 * 60 * 1000
  }
  
  return (now - lastPayment) >= interval
}

employeeSchema.methods.getPaymentAmount = function() {
  return this.payrollSettings.salaryAmount
}

employeeSchema.methods.updateLastPayment = function(timestamp = Date.now()) {
  this.payrollSettings.lastPaymentTimestamp = timestamp
  return this.save()
}

// Transform JSON output
employeeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('Employee', employeeSchema)

