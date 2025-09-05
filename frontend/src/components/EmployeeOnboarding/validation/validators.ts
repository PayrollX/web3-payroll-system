/**
 * Custom validation utilities for the employee onboarding form
 */

/**
 * Validates an email address
 * @param email - Email address to validate
 * @returns boolean - True if valid email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates an Ethereum wallet address
 * @param address - Wallet address to validate
 * @returns boolean - True if valid Ethereum address
 */
export const validateWalletAddress = (address: string): boolean => {
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
  return ethAddressRegex.test(address)
}

/**
 * Validates an ENS subdomain format
 * @param subdomain - ENS subdomain to validate
 * @returns boolean - True if valid ENS subdomain
 */
export const validateENSSubdomain = (subdomain: string): boolean => {
  // ENS subdomains should be 3-63 characters, alphanumeric with hyphens
  const ensRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/
  return ensRegex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 20
}

/**
 * Validates a phone number (international format)
 * @param phone - Phone number to validate
 * @returns boolean - True if valid phone number
 */
export const validatePhone = (phone: string): boolean => {
  // Supports international format with optional + prefix
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone)
}

/**
 * Validates salary amount
 * @param salary - Salary amount as string
 * @returns { isValid: boolean, error?: string }
 */
export const validateSalary = (salary: string): { isValid: boolean; error?: string } => {
  const amount = parseFloat(salary)
  
  if (isNaN(amount)) {
    return { isValid: false, error: 'Salary must be a valid number' }
  }
  
  if (amount <= 0) {
    return { isValid: false, error: 'Salary must be greater than 0' }
  }
  
  if (amount < 1000) {
    return { isValid: false, error: 'Salary seems too low. Please verify the amount.' }
  }
  
  if (amount > 10000000) {
    return { isValid: false, error: 'Salary seems very high. Please verify the amount.' }
  }
  
  return { isValid: true }
}

/**
 * Validates that percentages add up to 100
 * @param percentages - Array of percentage values
 * @returns { isValid: boolean, error?: string }
 */
export const validatePercentageTotal = (percentages: number[]): { isValid: boolean; error?: string } => {
  const total = percentages.reduce((sum, value) => sum + (value || 0), 0)
  const tolerance = 0.1 // Allow small floating point differences
  
  if (Math.abs(total - 100) > tolerance) {
    return { 
      isValid: false, 
      error: `Percentages must add up to 100% (currently ${total.toFixed(1)}%)` 
    }
  }
  
  return { isValid: true }
}

/**
 * Validates a start date is not in the past
 * @param dateString - Date string to validate
 * @returns { isValid: boolean, error?: string }
 */
export const validateStartDate = (dateString: string): { isValid: boolean; error?: string } => {
  if (!dateString) {
    return { isValid: false, error: 'Start date is required' }
  }
  
  const startDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to compare only dates
  
  if (startDate < today) {
    return { isValid: false, error: 'Start date cannot be in the past' }
  }
  
  // Check if date is too far in the future (more than 1 year)
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
  
  if (startDate > oneYearFromNow) {
    return { isValid: false, error: 'Start date cannot be more than 1 year in the future' }
  }
  
  return { isValid: true }
}

/**
 * Validates employee ID format
 * @param employeeId - Employee ID to validate
 * @returns { isValid: boolean, error?: string }
 */
export const validateEmployeeId = (employeeId: string): { isValid: boolean; error?: string } => {
  if (!employeeId) {
    return { isValid: false, error: 'Employee ID is required' }
  }
  
  // Employee ID should be 3-20 characters, alphanumeric
  const idRegex = /^[A-Z0-9]{3,20}$/
  
  if (!idRegex.test(employeeId)) {
    return { 
      isValid: false, 
      error: 'Employee ID must be 3-20 characters, uppercase letters and numbers only' 
    }
  }
  
  return { isValid: true }
}

/**
 * Validates text length
 * @param text - Text to validate
 * @param minLength - Minimum length (default: 0)
 * @param maxLength - Maximum length (default: 1000)
 * @param fieldName - Field name for error message
 * @returns { isValid: boolean, error?: string }
 */
export const validateTextLength = (
  text: string, 
  minLength = 0, 
  maxLength = 1000, 
  fieldName = 'Field'
): { isValid: boolean; error?: string } => {
  if (text.length < minLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be at least ${minLength} characters` 
    }
  }
  
  if (text.length > maxLength) {
    return { 
      isValid: false, 
      error: `${fieldName} must be less than ${maxLength} characters` 
    }
  }
  
  return { isValid: true }
}

/**
 * Validates that a value is one of the allowed options
 * @param value - Value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - Field name for error message
 * @returns { isValid: boolean, error?: string }
 */
export const validateEnum = (
  value: string, 
  allowedValues: string[], 
  fieldName = 'Field'
): { isValid: boolean; error?: string } => {
  if (!allowedValues.includes(value)) {
    return { 
      isValid: false, 
      error: `${fieldName} must be one of: ${allowedValues.join(', ')}` 
    }
  }
  
  return { isValid: true }
}

/**
 * Validates required field
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @returns { isValid: boolean, error?: string }
 */
export const validateRequired = (
  value: any, 
  fieldName = 'Field'
): { isValid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { 
      isValid: false, 
      error: `${fieldName} is required` 
    }
  }
  
  // For arrays, check if not empty
  if (Array.isArray(value) && value.length === 0) {
    return { 
      isValid: false, 
      error: `${fieldName} is required` 
    }
  }
  
  return { isValid: true }
}

/**
 * Checks if a string contains only safe characters (no XSS)
 * @param input - Input string to validate
 * @returns boolean - True if safe
 */
export const validateSafeString = (input: string): boolean => {
  // Check for potentially dangerous characters/patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(input))
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns boolean - True if valid URL
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Comprehensive form field validator
 * @param value - Value to validate
 * @param validationType - Type of validation to perform
 * @param options - Additional validation options
 * @returns { isValid: boolean, error?: string }
 */
export const validateField = (
  value: any,
  validationType: 'email' | 'wallet' | 'ens' | 'phone' | 'salary' | 'required' | 'text' | 'enum' | 'startDate',
  options?: {
    fieldName?: string
    minLength?: number
    maxLength?: number
    allowedValues?: string[]
  }
): { isValid: boolean; error?: string } => {
  const fieldName = options?.fieldName || 'Field'
  
  switch (validationType) {
    case 'required':
      return validateRequired(value, fieldName)
    
    case 'email':
      if (!validateEmail(value)) {
        return { isValid: false, error: 'Please enter a valid email address' }
      }
      return { isValid: true }
    
    case 'wallet':
      if (!validateWalletAddress(value)) {
        return { isValid: false, error: 'Please enter a valid Ethereum address' }
      }
      return { isValid: true }
    
    case 'ens':
      if (!validateENSSubdomain(value)) {
        return { isValid: false, error: 'Invalid ENS subdomain format' }
      }
      return { isValid: true }
    
    case 'phone':
      if (!validatePhone(value)) {
        return { isValid: false, error: 'Please enter a valid phone number' }
      }
      return { isValid: true }
    
    case 'salary':
      return validateSalary(value)
    
    case 'startDate':
      return validateStartDate(value)
    
    case 'text':
      return validateTextLength(
        value, 
        options?.minLength, 
        options?.maxLength, 
        fieldName
      )
    
    case 'enum':
      return validateEnum(
        value, 
        options?.allowedValues || [], 
        fieldName
      )
    
    default:
      return { isValid: true }
  }
}


