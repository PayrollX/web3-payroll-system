const { ethers } = require('ethers')

/**
 * Minimal Wallet-Only Authentication - Web3 Privacy-First
 * No user tracking, no personal data, just wallet verification
 * @author Dev Austin
 */

/**
 * Validate Ethereum wallet address
 */
const isValidWallet = (address) => {
  try {
    return ethers.utils.isAddress(address)
  } catch {
    return false
  }
}

/**
 * Extract and validate wallet address from headers
 * This is the ONLY authentication we need for Web3
 */
const requireWallet = (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address']
  
  if (!walletAddress) {
    return res.status(401).json({
      error: 'Wallet required',
      message: 'Provide wallet address in x-wallet-address header'
    })
  }
  
  if (!isValidWallet(walletAddress)) {
    return res.status(400).json({
      error: 'Invalid wallet',
      message: 'Provide valid Ethereum wallet address'
    })
  }
  
  // Store normalized wallet address
  req.wallet = walletAddress.toLowerCase()
  next()
}

/**
 * Optional wallet extraction (for public endpoints)
 */
const optionalWallet = (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address']
  
  if (walletAddress && isValidWallet(walletAddress)) {
    req.wallet = walletAddress.toLowerCase()
  }
  
  next()
}

module.exports = {
  requireWallet,
  optionalWallet,
  isValidWallet
}


