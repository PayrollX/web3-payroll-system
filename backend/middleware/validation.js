/**
 * Validation middleware for Web3 Payroll System
 * @author Dev Austin
 */

const { body, validationResult } = require('express-validator')

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

/**
 * Validate employee creation data
 */
const validateEmployee = [
  body('personalInfo.name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('personalInfo.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('employmentDetails.position')
    .notEmpty()
    .withMessage('Position is required'),
  
  body('employmentDetails.department')
    .notEmpty()
    .withMessage('Department is required'),
  
  body('employmentDetails.employmentType')
    .isIn(['full-time', 'part-time', 'contractor'])
    .withMessage('Invalid employment type'),
  
  body('payrollSettings.walletAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid wallet address format'),
  
  body('payrollSettings.salaryAmount')
    .isNumeric()
    .withMessage('Salary amount must be numeric')
    .isFloat({ min: 0.001, max: 1000 })
    .withMessage('Salary must be between 0.001 and 1000 ETH'),
  
  body('payrollSettings.paymentFrequency')
    .isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'])
    .withMessage('Invalid payment frequency'),
  
  body('ensDetails.subdomain')
    .isLength({ min: 3, max: 63 })
    .withMessage('ENS subdomain must be between 3 and 63 characters')
    .matches(/^[a-z0-9\-]+$/)
    .withMessage('ENS subdomain can only contain lowercase letters, numbers, and hyphens'),
  
  handleValidationErrors
]

/**
 * Validate employee update data
 */
const validateUpdateEmployee = [
  body('personalInfo.name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('personalInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('payrollSettings.salaryAmount')
    .optional()
    .isNumeric()
    .withMessage('Salary amount must be numeric')
    .isFloat({ min: 0.001, max: 1000 })
    .withMessage('Salary must be between 0.001 and 1000 ETH'),
  
  body('payrollSettings.paymentFrequency')
    .optional()
    .isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY'])
    .withMessage('Invalid payment frequency'),
  
  handleValidationErrors
]

/**
 * Validate payroll processing data
 */
const validatePayrollData = [
  body('employeeIds')
    .isArray({ min: 1 })
    .withMessage('At least one employee ID is required'),
  
  body('employeeIds.*')
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  
  handleValidationErrors
]

/**
 * Validate bonus data
 */
const validateBonus = [
  body('employeeId')
    .isMongoId()
    .withMessage('Invalid employee ID format'),
  
  body('amount')
    .isNumeric()
    .withMessage('Amount must be numeric')
    .isFloat({ min: 0.001 })
    .withMessage('Amount must be greater than 0.001'),
  
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
  
  body('tokenAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid token address format'),
  
  handleValidationErrors
]

/**
 * Validate ENS registration data
 */
const validateENSRegistration = [
  body('subdomain')
    .isLength({ min: 3, max: 63 })
    .withMessage('ENS subdomain must be between 3 and 63 characters')
    .matches(/^[a-z0-9\-]+$/)
    .withMessage('ENS subdomain can only contain lowercase letters, numbers, and hyphens'),
  
  body('employeeAddress')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Invalid employee address format'),
  
  handleValidationErrors
]

module.exports = {
  validateEmployee,
  validateUpdateEmployee,
  validatePayrollData,
  validateBonus,
  validateENSRegistration,
  handleValidationErrors
}

