/**
 * Authentication middleware for Web3 Payroll System
 * @author Dev Austin
 */

const jwt = require('jsonwebtoken')

/**
 * Authenticate user with JWT token or allow unauthenticated access for development
 */
const authMiddleware = (req, res, next) => {
  try {
    // For development, we'll allow requests without authentication
    // In production, you should implement proper JWT authentication
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret')
        req.user = decoded
      } catch (error) {
        console.log('Invalid token, proceeding without authentication')
      }
    }
    
    // Set default user for development
    if (!req.user) {
      req.user = {
        address: '0x0000000000000000000000000000000000000000',
        role: 'admin'
      }
    }
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

module.exports = authMiddleware

