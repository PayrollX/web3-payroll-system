const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

/**
 * Web3 Payroll System - Clean Backend
 * Privacy-First, Minimal Data, Decentralized
 */

const app = express()
const PORT = process.env.PORT || 3001

// Security
app.use(helmet({ crossOriginEmbedderPolicy: false }))
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000 // Much higher limit for development
}))

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Body parser
app.use(express.json({ limit: '1mb' }))

// Routes
const companyRoutes = require('./routes/companies')
const employeeRoutes = require('./routes/employees')
const analyticsRoutes = require('./routes/analytics')
const payrollRoutes = require('./routes/payroll')

app.use('/api/companies', companyRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/payroll', payrollRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    privacy: 'Web3 Privacy-First',
    timestamp: new Date().toISOString()
  })
})

// 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error)
  res.status(500).json({ error: 'Internal error' })
})

// MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/web3-payroll', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(error => {
  console.error('❌ MongoDB error:', error)
  process.exit(1)
})

// Graceful shutdown
const shutdown = async () => {
  console.log('🔄 Shutting down...')
  await mongoose.connection.close()
  console.log('✅ Closed')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Start
app.listen(PORT, () => {
  console.log(`🚀 Web3 Payroll API running on port ${PORT}`)
  console.log(`🔒 Privacy Mode: Minimal data only`)
})

module.exports = app