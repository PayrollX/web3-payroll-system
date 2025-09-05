const mongoose = require('mongoose')

/**
 * Web3 Company Model - Ultra Minimal
 * ONLY stores what's absolutely necessary for ENS + Payroll
 * NO personal data, NO tracking, NO Web2 bloat
 */

const companySchema = new mongoose.Schema({
  // Company name (public information)
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  
  // ENS domain (public blockchain data)
  ensDomain: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  },
  
  // ENS node hash (blockchain data)
  ensNode: { 
    type: String, 
    required: true 
  },
  
  // Owner wallet (decentralized identity)
  ownerWallet: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true
  }

}, {
  timestamps: false, // No tracking
  versionKey: false  // No version tracking
})

// Essential indexes only
companySchema.index({ ownerWallet: 1 })
companySchema.index({ ensDomain: 1 })

// Essential methods only
companySchema.statics.findByWallet = function(wallet) {
  return this.findOne({ ownerWallet: wallet.toLowerCase() })
}

companySchema.statics.findByDomain = function(domain) {
  return this.findOne({ ensDomain: domain.toLowerCase() })
}

module.exports = mongoose.model('Company', companySchema)