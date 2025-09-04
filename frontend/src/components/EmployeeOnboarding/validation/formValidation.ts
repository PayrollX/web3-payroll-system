import yup from "yup";

// Validation schemas for each step
const identitySchema = yup.object({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  phone: yup
    .string()
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  
  walletAddress: yup
    .string()
    .required('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum address'),
  
  ensSubdomain: yup
    .string()
    .required('ENS subdomain is required')
    .min(3, 'Subdomain must be at least 3 characters')
    .max(20, 'Subdomain must be less than 20 characters')
    .matches(/^[a-zA-Z0-9-]+$/, 'Only letters, numbers, and hyphens allowed')
})

const employmentSchema = yup.object({
  jobTitle: yup
    .string()
    .required('Job title is required')
    .min(2, 'Job title must be at least 2 characters'),
  
  department: yup
    .string()
    .required('Department is required'),
  
  employmentType: yup
    .string()
    .required('Employment type is required')
    .oneOf(['Full-time', 'Part-time', 'Contractor', 'Intern']),
  
  startDate: yup
    .string()
    .required('Start date is required')
    .test('is-future-date', 'Start date cannot be in the past', function(value: any) {
      if (!value) return false
      const selectedDate = new Date(value)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return selectedDate >= today
    }),
  
  workLocation: yup
    .string()
    .required('Work location is required')
    .oneOf(['Remote', 'Office', 'Hybrid']),
  
  timeZone: yup
    .string()
    .required('Time zone is required'),
  
  employeeId: yup
    .string()
    .optional()
    .min(3, 'Employee ID must be at least 3 characters'),
  
  manager: yup
    .string()
    .optional(),
  
  workingHours: yup
    .string()
    .optional(),
  
  skills: yup
    .array()
    .of(yup.string())
    .optional(),
  
  experience: yup
    .string()
    .optional()
})

const payrollSchema = yup.object({
  salary: yup
    .string()
    .required('Salary is required')
    .test('is-positive-number', 'Salary must be a positive number', function(value: any) {
      if (!value) return false
      const num = parseFloat(value)
      return !isNaN(num) && num > 0
    }),
  
  currency: yup
    .string()
    .required('Currency is required')
    .oneOf(['USD', 'EUR', 'GBP', 'CAD']),
  
  frequency: yup
    .string()
    .required('Payment frequency is required')
    .oneOf(['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly']),
  
  preferredToken: yup
    .string()
    .required('Preferred payment token is required')
    .oneOf(['ETH', 'USDC', 'USDT', 'DAI']),
  
  paymentDay: yup
    .number()
    .optional()
    .min(1, 'Payment day must be between 1 and 28')
    .max(28, 'Payment day must be between 1 and 28'),
  
  taxJurisdiction: yup
    .string()
    .required('Tax jurisdiction is required'),
  
  emergencyWallet: yup
    .string()
    .optional()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum address'),
  
  autoConversion: yup.object({
    enabled: yup.boolean().optional(),
    stablecoinPercentage: yup.number().optional().min(0).max(100),
    ethPercentage: yup.number().optional().min(0).max(100)
  }).optional(),
  
  paymentSplitting: yup.object({
    enabled: yup.boolean().optional(),
    mainWallet: yup.number().optional().min(0).max(100),
    savingsWallet: yup.number().optional().min(0).max(100),
    defiProtocols: yup.number().optional().min(0).max(100),
    savingsWalletAddress: yup
      .string()
      .optional()
      .matches(/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum address')
  }).optional()
})

const preferencesSchema = yup.object({
  language: yup
    .string()
    .required('Language preference is required'),
  
  communicationStyle: yup
    .string()
    .optional()
    .oneOf(['formal', 'casual']),
  
  referralSource: yup
    .string()
    .required('Please tell us how you heard about us'),
  
  goals: yup
    .string()
    .optional()
    .max(500, 'Goals must be less than 500 characters'),
  
  deliveryAddress: yup
    .string()
    .optional()
    .max(200, 'Address must be less than 200 characters'),
  
  emergencyContact: yup.object({
    name: yup
      .string()
      .required('Emergency contact name is required')
      .min(2, 'Name must be at least 2 characters'),
    
    phone: yup
      .string()
      .required('Emergency contact phone is required')
      .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
    
    relationship: yup
      .string()
      .optional()
  }).required('Emergency contact information is required'),
  
  complianceAcknowledged: yup
    .boolean()
    .required('You must acknowledge the compliance terms')
    .oneOf([true], 'You must acknowledge the compliance terms'),
  
  notifications: yup.object({
    email: yup.boolean().optional(),
    sms: yup.boolean().optional(),
    discord: yup.boolean().optional(),
    slack: yup.boolean().optional()
  }).optional()
})

// Step validation schemas array
const stepSchemas = [identitySchema, employmentSchema, payrollSchema, preferencesSchema]

// Step names for debugging
const stepNames = ['identity', 'employment', 'payroll', 'preferences']

/**
 * Validates a specific step of the form
 * @param stepIndex - The step index (0-3)
 * @param data - The data to validate
 * @returns Promise<{ isValid: boolean, errors: Record<string, string> }>
 */
export const validateStep = async (
  stepIndex: number, 
  data: any
): Promise<{ isValid: boolean; errors: Record<string, string> }> => {
  try {
    const schema = stepSchemas[stepIndex]
    
    if (!schema) {
      throw new Error(`Invalid step index: ${stepIndex}`)
    }

    await schema.validate(data, { abortEarly: false })
    return { isValid: true, errors: {} }
    
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'inner' in error) {
      const validationError = error as yup.ValidationError
      const errors: Record<string, string> = {}
      
      validationError.inner.forEach((err: any) => {
        if (err.path) {
          errors[err.path] = err.message
        }
      })
      
      console.warn(`Step ${stepIndex + 1} (${stepNames[stepIndex]}) validation failed:`, errors)
      return { isValid: false, errors }
    }
    
    console.error('Unexpected validation error:', error)
    return { 
      isValid: false, 
      errors: { general: 'An unexpected validation error occurred' } 
    }
  }
}

/**
 * Validates the entire form across all steps
 * @param formData - Complete form data
 * @returns Promise<{ isValid: boolean, stepErrors: Record<string, Record<string, string>> }>
 */
export const validateFullForm = async (
  formData: any
): Promise<{ isValid: boolean; stepErrors: Record<string, Record<string, string>> }> => {
  const stepErrors: Record<string, Record<string, string>> = {}
  let isValid = true

  // Validate each step
  for (let i = 0; i < stepSchemas.length; i++) {
    const stepKey = stepNames[i]
    const stepData = formData[stepKey]
    
    const validation = await validateStep(i, stepData)
    
    if (!validation.isValid) {
      stepErrors[stepKey] = validation.errors
      isValid = false
    }
  }

  return { isValid, stepErrors }
}

/**
 * Custom validation for business logic
 */
export const validateBusinessRules = (formData: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {}

  // Check payment splitting percentages add up to 100%
  if (formData.payroll?.paymentSplitting?.enabled) {
    const splitting = formData.payroll.paymentSplitting
    const total = (splitting.mainWallet || 0) + (splitting.savingsWallet || 0) + (splitting.defiProtocols || 0)
    
    if (Math.abs(total - 100) > 0.1) {
      errors['paymentSplitting.total'] = 'Payment splitting percentages must add up to 100%'
    }
  }

  // Check auto-conversion percentages add up to 100%
  if (formData.payroll?.autoConversion?.enabled) {
    const conversion = formData.payroll.autoConversion
    const total = (conversion.stablecoinPercentage || 0) + (conversion.ethPercentage || 0)
    
    if (Math.abs(total - 100) > 0.1) {
      errors['autoConversion.total'] = 'Auto-conversion percentages must add up to 100%'
    }
  }

  // Validate salary is reasonable (between $1,000 and $1,000,000)
  if (formData.payroll?.salary) {
    const salary = parseFloat(formData.payroll.salary)
    if (salary < 1000) {
      errors['salary.min'] = 'Salary seems too low. Please verify the amount.'
    }
    if (salary > 1000000) {
      errors['salary.max'] = 'Salary seems very high. Please verify the amount.'
    }
  }

  // Validate ENS subdomain doesn't contain restricted words
  if (formData.identity?.ensSubdomain) {
    const restrictedWords = ['admin', 'root', 'support', 'help', 'api', 'www', 'mail', 'email']
    const subdomain = formData.identity.ensSubdomain.toLowerCase()
    
    if (restrictedWords.some(word => subdomain.includes(word))) {
      errors['ensSubdomain.restricted'] = 'This subdomain contains restricted words'
    }
  }

  return { 
    isValid: Object.keys(errors).length === 0, 
    errors 
  }
}

export default {
  validateStep,
  validateFullForm,
  validateBusinessRules
}
