/**
 * Employee Onboarding Components
 * 
 * A comprehensive 4-step Web3 employee onboarding system with:
 * - Progressive form with smart validation
 * - Real-time ENS integration
 * - Wallet connection and verification
 * - DeFi payment features
 * - Auto-save progress
 * - Beautiful animations and UX
 */

// Main form component
export { default as EmployeeOnboardingForm, useFormStore } from './EmployeeOnboardingForm'

// Individual step components
export { default as IdentityStep } from './steps/IdentityStep'
export { default as EmploymentStep } from './steps/EmploymentStep' 
export { default as PayrollStep } from './steps/PayrollStep'
export { default as PreferencesStep } from './steps/PreferencesStep'

// Validation utilities
export { 
  validateStep, 
  validateFullForm, 
  validateBusinessRules 
} from './validation/formValidation'

export {
  validateEmail,
  validateWalletAddress,
  validateENSSubdomain,
  validatePhone,
  validateSalary,
  validatePercentageTotal,
  validateStartDate,
  validateEmployeeId,
  validateField
} from './validation/validators'

// Types
export type { FormData } from './EmployeeOnboardingForm'


