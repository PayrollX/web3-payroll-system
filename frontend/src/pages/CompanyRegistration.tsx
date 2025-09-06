import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  alpha,
  useTheme
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  Business as BusinessIcon,
  Dns as DnsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '../context/AuthContext'
import { useENS } from '../hooks/useENS'
import { waitForTransactionConfirmation, getEtherscanTxUrl } from '../utils/transactionVerification'

/**
 * Company Registration Page
 * Handles wallet connection and company setup for employers
 * @author Dev Austin
 */

interface CompanyFormData {
  companyName: string
  companyDomain: string
}

const steps = [
  'Connect Wallet',
  'Company Information',
  'Domain Setup',
  'Confirmation'
]


const CompanyRegistration: React.FC = () => {
  const theme = useTheme()
  const { address, isConnected } = useAccount()
  const { refreshStatus } = useAuth()
  const { registerETHDomain } = useENS()
  const navigate = useNavigate()

  // Component state
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState<CompanyFormData>({
    companyName: '',
    companyDomain: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [domainAvailable, setDomainAvailable] = useState<boolean | null>(null)
  const [domainCheckDetails, setDomainCheckDetails] = useState<any>(null)
  const [checkingDomain, setCheckingDomain] = useState(false)
  const [registeredCompany, setRegisteredCompany] = useState<any>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Check if user already has a company registered
  useEffect(() => {
    if (isConnected && address) {
      checkExistingCompany()
    }
  }, [isConnected, address])

  // Auto-advance to step 1 when wallet is connected
  useEffect(() => {
    if (isConnected && activeStep === 0) {
      setActiveStep(1)
    }
  }, [isConnected, activeStep])

  // Check for existing company
  const checkExistingCompany = async () => {
    try {
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/api'
      const response = await fetch(`${baseUrl}/companies/profile`, {
        headers: {
          'x-wallet-address': address!
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRegisteredCompany(data.company)
          setActiveStep(3) // Jump to confirmation step
        }
      }
    } catch (error) {
      console.log('No existing company found')
    }
  }


  // Handle form input changes
  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate domain from company name
    if (field === 'companyName' && value) {
      const domain = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '')
        .substring(0, 20)
      
      setFormData(prev => ({
        ...prev,
        companyDomain: domain
      }))
      setDomainAvailable(null)
    }

    // Clear domain availability when domain changes
    if (field === 'companyDomain') {
      setDomainAvailable(null)
      setDomainCheckDetails(null)
    }
  }

  // Check domain availability
  const checkDomainAvailability = async () => {
    if (!formData.companyDomain) return

    setCheckingDomain(true)
    setError(null)
    try {
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/api'
      const response = await fetch(`${baseUrl}/companies/check-domain/${formData.companyDomain}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setDomainAvailable(data.available)
      setDomainCheckDetails(data)
      
      // Log detailed ENS check results for debugging
      console.log('Domain availability check:', {
        domain: data.domain,
        available: data.available,
        source: data.source,
        ensCheck: data.details?.ensCheck,
        databaseCheck: data.details?.databaseCheck
      })
    } catch (error) {
      console.error('Domain check error:', error)
      setError('Failed to check domain availability. Please try again.')
    } finally {
      setCheckingDomain(false)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/api'
      
      // Step 1: Get registration info from backend
      console.log('🔗 Getting ENS registration info...')
      const response = await fetch(`${baseUrl}/companies/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to get registration info')
      }

      const { registrationInfo, companyData } = data
      console.log('✅ Registration info received:', registrationInfo)

      // Step 2: Perform actual ENS registration on frontend with verification
      console.log('🚀 Starting real ENS registration...')
      console.log(`💰 Real registration cost: ${registrationInfo.cost}`)
      
      // Use the real ENS registration function
      const ensResult = await registerETHDomain(formData.companyDomain, 31536000) // 1 year
      
      if (!ensResult.success) {
        throw new Error(ensResult.error || 'ENS registration failed')
      }
      
      console.log(`✅ ENS registration transaction submitted: ${ensResult.transactionHash}`)
      const transactionHash = ensResult.transactionHash!

      // Step 2.5: Wait for proper transaction confirmation on Etherscan
      console.log('⏳ Waiting for transaction confirmation on blockchain...')
      console.log(`🔗 View transaction: ${getEtherscanTxUrl(transactionHash, 11155111)}`)
      
      setProgress('Waiting for blockchain confirmation...')
      
      const confirmationResult = await waitForTransactionConfirmation(
        transactionHash,
        11155111, // Sepolia chain ID
        2, // Require 2 confirmations
        180000, // 3 minutes timeout
        process.env.REACT_APP_ETHERSCAN_API_KEY
      )
      
      if (!confirmationResult.success || confirmationResult.status !== 'success') {
        throw new Error(
          confirmationResult.error || 
          'Transaction failed or was not confirmed within timeout period'
        )
      }
      
      console.log(`✅ Transaction confirmed on blockchain! Block: ${confirmationResult.blockNumber}`)
      console.log(`⛽ Gas used: ${confirmationResult.gasUsed}`)

      // Step 3: Create company only after successful blockchain confirmation
      console.log('🏢 Creating company after confirmed ENS registration...')
      setProgress('Creating company profile...')
      
      const createResponse = await fetch(`${baseUrl}/companies/create-after-ens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address
        },
        body: JSON.stringify({
          companyData,
          transactionHash,
          blockNumber: confirmationResult.blockNumber,
          gasUsed: confirmationResult.gasUsed
        })
      })

      const createData = await createResponse.json()

      if (!createResponse.ok || !createData.success) {
        throw new Error(createData.error || 'Failed to create company')
      }

      console.log('✅ Company created successfully:', createData.company)

      // Set success state
      setRegisteredCompany(createData.company)
      setSuccess(true)
      setShowSuccessDialog(true)
      setActiveStep(3)
      
      // Refresh auth status to update hasCompany state
      console.log('🔄 Refreshing auth status after successful registration...')
      await refreshStatus()
      
      // Automatically redirect to dashboard after 3 seconds
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...')
        navigate('/dashboard', { replace: true })
      }, 3000)

    } catch (error: any) {
      console.error('❌ Registration failed:', error)
      setError(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle next step
  const handleNext = () => {
    if (activeStep === 2) {
      handleSubmit()
    } else {
      setActiveStep(prev => prev + 1)
    }
  }

  // Handle previous step
  const handleBack = () => {
    setActiveStep(prev => prev - 1)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Validate step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        return isConnected
      case 1:
        return !!(formData.companyName)
      case 2:
        return !!(formData.companyDomain && domainAvailable)
      default:
        return true
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <WalletIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={4}>
              Connect your Ethereum wallet to register your company
            </Typography>
            
            {!isConnected ? (
              <Box>
                <ConnectButton />
              </Box>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Wallet connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </Alert>
                <Button variant="contained" onClick={() => setActiveStep(1)}>
                  Continue
                </Button>
              </Box>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon /> Company Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  required
                  helperText="Enter your company's official name"
                />
              </Grid>
            </Grid>
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DnsIcon /> ENS Domain Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Your company will get a unique ENS domain for employee management
            </Typography>
            
            <Box mb={3}>
              <TextField
                fullWidth
                label="Company Domain"
                value={formData.companyDomain}
                onChange={(e) => handleInputChange('companyDomain', e.target.value)}
                InputProps={{
                  endAdornment: (
                    <Typography color="text.secondary" sx={{ mr: 1 }}>
                      .eth
                    </Typography>
                  )
                }}
                helperText="This will be your company's ENS domain (e.g., mycompany.eth)"
              />
              
              <Box mt={2}>
                <Button
                  variant="outlined"
                  onClick={checkDomainAvailability}
                  disabled={!formData.companyDomain || checkingDomain}
                  startIcon={checkingDomain ? <CircularProgress size={20} /> : <RefreshIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      backgroundColor: alpha(theme.palette.primary.main, 0.04)
                    },
                    '&:disabled': {
                      borderColor: 'action.disabled',
                      color: 'action.disabled'
                    }
                  }}
                >
                  {checkingDomain ? 'Checking...' : 'Check Availability'}
                </Button>
              </Box>
            </Box>

            {domainAvailable !== null && domainCheckDetails && (
              <Alert 
                severity={domainAvailable ? 'success' : 'error'} 
                sx={{ mb: 2 }}
                icon={domainAvailable ? <CheckIcon /> : <ErrorIcon />}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {domainAvailable 
                      ? `${formData.companyDomain}.eth is available!`
                      : `${formData.companyDomain}.eth is not available`
                    }
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                    {domainCheckDetails.message}
                  </Typography>
                  {domainCheckDetails.source && (
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.6 }}>
                      Source: {domainCheckDetails.source === 'ens_blockchain' ? 'ENS Blockchain' : 
                               domainCheckDetails.source === 'local_database' ? 'Local Database' :
                               domainCheckDetails.source === 'simulation' ? 'Local Simulation' : 
                               domainCheckDetails.source}
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="subtitle2" gutterBottom>
                What you'll get:
              </Typography>
              <Typography variant="body2" component="div">
                • Company domain: <strong>{formData.companyDomain || 'yourcompany'}.eth</strong><br/>
                • Employee subdomains: <strong>employee.{formData.companyDomain || 'yourcompany'}.eth</strong><br/>
                • Decentralized identity management<br/>
                • Professional Web3 presence
              </Typography>
            </Paper>
          </Box>
        )

      case 3:
        return (
          <Box textAlign="center">
            {registeredCompany ? (
              <Box>
                <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Company Registered Successfully!
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={4}>
                  Your company is now ready for Web3 payroll management
                </Typography>

                <Paper sx={{ p: 3, textAlign: 'left', mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Registration Details:
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Company:</Typography>
                      <Typography>{registeredCompany.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Domain:</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>{registeredCompany.domain}</Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(registeredCompany.domain)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Owner Wallet:</Typography>
                      <Typography sx={{ fontFamily: 'monospace' }}>
                        {registeredCompany.ownerWallet?.slice(0, 6)}...{registeredCompany.ownerWallet?.slice(-4)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Max Employees:</Typography>
                      <Typography>{registeredCompany.maxEmployees}</Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Button
                  variant="contained"
                  size="large"
                  href="/dashboard"
                >
                  Go to Dashboard
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                {progress && (
                  <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                    {progress}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom>
          Register Your Company
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Set up your Web3 payroll management system
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep < steps.length - 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid(activeStep) || loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Next'}
            </Button>
          )}
        </Box>
      </Paper>

      {/* Success Dialog */}
      <Dialog 
        open={showSuccessDialog} 
        onClose={() => {}} // Prevent closing dialog to avoid navigation issues
        disableEscapeKeyDown
      >
        <DialogTitle>🎉 Registration Complete!</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Your company has been successfully registered on the blockchain with ENS domain purchase confirmed!
          </Typography>
          {registeredCompany && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" color="primary">Company Details:</Typography>
              <Typography variant="body2">Name: {registeredCompany.name}</Typography>
              <Typography variant="body2">ENS Domain: {registeredCompany.ensDomain}</Typography>
              <Typography variant="body2">Owner: {registeredCompany.ownerWallet}</Typography>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            🔄 Redirecting to dashboard in 3 seconds...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={async () => {
              console.log('🔄 Manual redirect to dashboard...')
              // Refresh auth status before redirecting
              await refreshStatus()
              navigate('/dashboard', { replace: true })
            }} 
            variant="contained"
          >
            Go to Dashboard Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default CompanyRegistration
