import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Button,
  Avatar,
  Alert,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  PhotoCamera as PhotoCameraIcon,
  AccountBalanceWallet as WalletIcon,
  Language as ENSIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import { useFormStore } from '../EmployeeOnboardingForm'
import { validateEmail, validateWalletAddress } from '../validation/validators'

// ENS Service (mock implementation)
class ENSService {
  private static instance: ENSService
  private companyDomain = 'company.eth'

  static getInstance(): ENSService {
    if (!ENSService.instance) {
      ENSService.instance = new ENSService()
    }
    return ENSService.instance
  }

  async checkSubdomainAvailability(subdomain: string): Promise<{
    isAvailable: boolean
    suggestions?: string[]
  }> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock availability check
    const unavailableSubdomains = ['admin', 'support', 'hr', 'finance', 'ceo', 'cto']
    const isAvailable = !unavailableSubdomains.includes(subdomain.toLowerCase())
    
    let suggestions: string[] = []
    if (!isAvailable) {
      suggestions = [
        `${subdomain}1`,
        `${subdomain}-dev`,
        `${subdomain}.team`,
        `new-${subdomain}`
      ]
    }
    
    return { isAvailable, suggestions }
  }

  async createSubdomain(subdomain: string, walletAddress: string): Promise<boolean> {
    // Mock ENS subdomain creation
    console.log(`Creating ENS subdomain: ${subdomain}.${this.companyDomain} for ${walletAddress}`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    return true
  }

  getFullDomain(subdomain: string): string {
    return `${subdomain}.${this.companyDomain}`
  }
}

interface IdentityStepProps {
  onProgressUpdate: (progress: number) => void
}

/**
 * 🆔 Identity & Web3 Setup Step
 * 
 * This step handles:
 * - Personal information collection
 * - Wallet connection and verification
 * - ENS subdomain creation with real-time availability
 * - Profile picture and ENS avatar setup
 * - Smart auto-completion features
 */
export const IdentityStep: React.FC<IdentityStepProps> = ({ onProgressUpdate }) => {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName })
  
  const { formData, updateFormData, errors } = useFormStore()
  const identityData = formData.identity || {}

  // Local state
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>('')
  const [ensChecking, setEnsChecking] = useState(false)
  const [ensAvailable, setEnsAvailable] = useState<boolean | null>(null)
  const [ensSuggestions, setEnsSuggestions] = useState<string[]>([])
  const [walletVerified, setWalletVerified] = useState(false)

  const ensService = ENSService.getInstance()

  // Calculate step progress
  useEffect(() => {
    const requiredFields = ['fullName', 'email', 'walletAddress', 'ensSubdomain']
    const completedFields = requiredFields.filter(field => 
      identityData[field as keyof typeof identityData]
    ).length
    
    const progress = (completedFields / requiredFields.length) * 100
    onProgressUpdate(progress)
  }, [identityData, onProgressUpdate])

  // Auto-populate wallet address when connected
  useEffect(() => {
    if (isConnected && address && !identityData.walletAddress) {
      updateFormData('identity', { walletAddress: address })
      setWalletVerified(true)
    }
  }, [isConnected, address, identityData.walletAddress, updateFormData])

  // Auto-populate ENS name if available
  useEffect(() => {
    if (ensName && !identityData.ensSubdomain) {
      const subdomain = ensName.replace('.eth', '').split('.')[0]
      updateFormData('identity', { ensSubdomain: subdomain })
    }
  }, [ensName, identityData.ensSubdomain, updateFormData])

  // Handle profile picture upload
  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      updateFormData('identity', { profilePicture: file })
    }
  }

  // Handle ENS subdomain checking
  const checkENSAvailability = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setEnsAvailable(null)
      setEnsSuggestions([])
      return
    }

    setEnsChecking(true)
    try {
      const result = await ensService.checkSubdomainAvailability(subdomain)
      setEnsAvailable(result.isAvailable)
      setEnsSuggestions(result.suggestions || [])
    } catch (error) {
      console.error('ENS availability check failed:', error)
      setEnsAvailable(false)
    } finally {
      setEnsChecking(false)
    }
  }, [ensService])

  // Debounced ENS checking
  useEffect(() => {
    const timer = setTimeout(() => {
      if (identityData.ensSubdomain) {
        checkENSAvailability(identityData.ensSubdomain)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [identityData.ensSubdomain, checkENSAvailability])

  // Auto-generate subdomain from name
  const generateSubdomainFromName = (fullName: string) => {
    if (!fullName) return ''
    
    return fullName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 15)
  }

  // Handle name change and auto-generate subdomain
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fullName = event.target.value
    updateFormData('identity', { fullName })
    
    // Auto-generate subdomain if not manually set
    if (!identityData.ensSubdomain) {
      const generatedSubdomain = generateSubdomainFromName(fullName)
      if (generatedSubdomain) {
        updateFormData('identity', { ensSubdomain: generatedSubdomain })
      }
    }
  }

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData('identity', { [field]: event.target.value })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add a toast notification here
  }

  const connectWallet = async () => {
    // This would trigger wallet connection
    // Implementation depends on your wallet connector
    console.log('Triggering wallet connection...')
  }

  const verifyWallet = async () => {
    if (!address) return
    
    try {
      // This would request a signature to verify ownership
      setWalletVerified(true)
      // Could implement actual signature verification here
    } catch (error) {
      console.error('Wallet verification failed:', error)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        👤 Let's set up your Web3 identity
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        We'll create your digital identity and ENS subdomain for seamless Web3 interactions.
      </Typography>

      <Grid container spacing={4}>
        {/* Personal Information */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📝 Personal Information
              </Typography>
              
              <Box mb={3}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={identityData.fullName || ''}
                  onChange={handleNameChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={identityData.email || ''}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email || 'We\'ll use this for important notifications'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Phone Number (Optional)"
                  value={identityData.phone || ''}
                  onChange={handleInputChange('phone')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Profile Picture */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Profile Picture
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    src={profilePreview || ensAvatar || undefined}
                    sx={{ width: 80, height: 80 }}
                  >
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-picture-upload"
                      type="file"
                      onChange={handleProfilePictureChange}
                    />
                    <label htmlFor="profile-picture-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCameraIcon />}
                      >
                        Upload Photo
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      This will also be used as your ENS avatar
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Web3 Identity */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🌐 Web3 Identity
              </Typography>

              {/* Wallet Connection */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Wallet Address
                </Typography>
                
                {!isConnected ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={connectWallet}
                    startIcon={<WalletIcon />}
                    sx={{ mb: 2 }}
                  >
                    Connect Wallet
                  </Button>
                ) : (
                  <Box>
                    <TextField
                      fullWidth
                      value={identityData.walletAddress || ''}
                      onChange={handleInputChange('walletAddress')}
                      error={!!errors.walletAddress}
                      helperText={errors.walletAddress}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WalletIcon />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Copy address">
                              <IconButton
                                onClick={() => copyToClipboard(identityData.walletAddress || '')}
                              >
                                <CopyIcon />
                              </IconButton>
                            </Tooltip>
                            {walletVerified ? (
                              <CheckIcon color="success" />
                            ) : (
                              <Button size="small" onClick={verifyWallet}>
                                Verify
                              </Button>
                            )}
                          </InputAdornment>
                        ),
                      }}
                      sx={{ mb: 2 }}
                    />
                    
                    {walletVerified && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        ✅ Wallet verified successfully!
                      </Alert>
                    )}
                  </Box>
                )}
              </Box>

              {/* ENS Subdomain */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Choose Your ENS Subdomain
                </Typography>
                
                <TextField
                  fullWidth
                  label="ENS Subdomain"
                  value={identityData.ensSubdomain || ''}
                  onChange={handleInputChange('ensSubdomain')}
                  error={!!errors.ensSubdomain || ensAvailable === false}
                  helperText={
                    errors.ensSubdomain || 
                    (ensAvailable === false ? 'This subdomain is taken' : 
                     ensAvailable === true ? 'Available! ✅' : 
                     'Choose your unique identifier')
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ENSIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography variant="body2" color="text.secondary">
                          .company.eth
                        </Typography>
                        {ensChecking && <CircularProgress size={20} />}
                        {ensAvailable === true && <CheckIcon color="success" />}
                        {ensAvailable === false && <CloseIcon color="error" />}
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                {/* ENS Preview */}
                {identityData.ensSubdomain && (
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'primary.50',
                      border: 1,
                      borderColor: 'primary.200'
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Your ENS Domain Preview:
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {ensService.getFullDomain(identityData.ensSubdomain)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      This will be your unique Web3 identity
                    </Typography>
                  </Paper>
                )}

                {/* ENS Suggestions */}
                {ensSuggestions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Suggested alternatives:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {ensSuggestions.map((suggestion) => (
                        <Chip
                          key={suggestion}
                          label={suggestion}
                          onClick={() => updateFormData('identity', { ensSubdomain: suggestion })}
                          clickable
                          size="small"
                          icon={<AutoAwesomeIcon />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Setup Tips */}
      <Card sx={{ mt: 3, bgcolor: 'info.50', borderColor: 'info.200', border: 1 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="info.main">
            💡 Quick Setup Tips
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="Auto-generated subdomain" 
                secondary="We've suggested a subdomain based on your name" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <WalletIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Connect your wallet" 
                secondary="For the best experience and automatic verification" 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ENSIcon color="secondary" />
              </ListItemIcon>
              <ListItemText 
                primary="ENS domain benefits" 
                secondary="Your colleagues can send payments to yourname.company.eth" 
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}

export default IdentityStep

