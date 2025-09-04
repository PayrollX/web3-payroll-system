import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch,
  Checkbox,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Gavel as ComplianceIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Done as DoneIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useFormStore } from '../EmployeeOnboardingForm'
import { useAccount, useSignMessage } from 'wagmi'

interface PreferencesStepProps {
  onProgressUpdate: (progress: number) => void
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
]

const referralSources = [
  'LinkedIn',
  'AngelList',
  'Company Website',
  'Employee Referral',
  'Recruiter',
  'Job Board',
  'Social Media',
  'Conference/Event',
  'Other'
]

/**
 * 🎯 Preferences & Finalization Step
 * 
 * This step handles:
 * - Communication preferences and notifications
 * - Language and cultural preferences
 * - Emergency contacts and compliance
 * - Final review of all information
 * - Web3 signature for contract acceptance
 * - Employee onboarding completion
 */
export const PreferencesStep: React.FC<PreferencesStepProps> = ({ onProgressUpdate }) => {
  const { address } = useAccount()
  const { signMessage } = useSignMessage()
  
  const { 
    formData, 
    updateFormData, 
    errors, 
    isSubmitting, 
    setSubmitting,
    reset 
  } = useFormStore()
  
  const preferencesData = formData.preferences || {}
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'signing' | 'submitting' | 'success' | 'error'>('idle')
  const [signatureHash, setSignatureHash] = useState<string>('')

  // Calculate step progress
  useEffect(() => {
    const requiredFields = [
      'language',
      'referralSource',
      'emergencyContact.name',
      'emergencyContact.phone',
      'complianceAcknowledged'
    ]
    
    const completedFields = requiredFields.filter(field => {
      const keys = field.split('.')
      let value: any = preferencesData
      for (const key of keys) {
        value = value?.[key]
      }
      return value
    }).length
    
    const progress = (completedFields / requiredFields.length) * 100
    onProgressUpdate(progress)
  }, [preferencesData, onProgressUpdate])

  const handleInputChange = (field: string) => (event: any) => {
    const value = event.target ? event.target.value : event
    updateFormData('preferences', { [field]: value })
  }

  const handleNotificationChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const notifications = preferencesData.notifications || {}
    updateFormData('preferences', {
      notifications: {
        ...notifications,
        [field]: event.target.checked
      }
    })
  }

  const handleEmergencyContactChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const emergencyContact = preferencesData.emergencyContact || {}
    updateFormData('preferences', {
      emergencyContact: {
        ...emergencyContact,
        [field]: event.target.value
      }
    })
  }

  const handleCompleteOnboarding = async () => {
    setIsSubmitDialogOpen(true)
  }

  const handleSubmitConfirm = async () => {
    setSubmitting(true)
    setSubmissionStatus('signing')

    try {
      // Step 1: Web3 Signature for contract acceptance
      const contractMessage = `I accept the employment terms and authorize the creation of my employee profile with the following details:

Employee: ${formData.identity?.fullName}
Position: ${formData.employment?.jobTitle} in ${formData.employment?.department}
Salary: ${formData.payroll?.salary} ${formData.payroll?.currency}
Wallet: ${formData.identity?.walletAddress}
ENS: ${formData.identity?.ensSubdomain}.company.eth

Timestamp: ${new Date().toISOString()}`

      let signature: string = ''
      try {
        // signMessage from Wagmi doesn't return the signature directly
        // It triggers the signing process, we'll mock the signature for now
        await signMessage({ message: contractMessage })
        // In a real implementation, you'd get the signature from the signMessage result
        // For now, we'll create a mock signature
        signature = `0x${Math.random().toString(16).substring(2).padStart(128, '0')}`
        setSignatureHash(signature)
      } catch (error) {
        console.error('Signature failed:', error)
        setSubmissionStatus('error')
        return
      }
      setSubmissionStatus('submitting')

      // Step 2: Submit to backend API
      const completeFormData = {
        ...formData,
        contractSignature: signature,
        contractMessage,
        submittedAt: new Date().toISOString()
      }

      // Mock API submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 3: Create ENS subdomain (mock)
      console.log('Creating ENS subdomain:', formData.identity?.ensSubdomain)
      
      // Step 4: Add to smart contract (mock)
      console.log('Adding employee to smart contract')
      
      setSubmissionStatus('success')
      
      // Reset form after successful submission
      setTimeout(() => {
        reset()
        setIsSubmitDialogOpen(false)
        setSubmissionStatus('idle')
      }, 3000)

    } catch (error) {
      console.error('Submission failed:', error)
      setSubmissionStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        🎯 Final preferences and review
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Almost done! Set your preferences and review your information before completing the onboarding.
      </Typography>

      <Grid container spacing={4}>
        {/* Communication Preferences */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📢 Communication Preferences
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Preferred Language</InputLabel>
                <Select
                  value={preferencesData.language || 'en'}
                  onChange={handleInputChange('language')}
                  error={!!errors.language}
                >
                  {languages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Communication Style</InputLabel>
                <Select
                  value={preferencesData.communicationStyle || 'formal'}
                  onChange={handleInputChange('communicationStyle')}
                >
                  <MenuItem value="formal">Formal & Professional</MenuItem>
                  <MenuItem value="casual">Casual & Friendly</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom>
                Notification Preferences
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesData.notifications?.email || true}
                      onChange={handleNotificationChange('email')}
                    />
                  }
                  label="Email notifications for payments"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesData.notifications?.sms || false}
                      onChange={handleNotificationChange('sms')}
                    />
                  }
                  label="SMS for urgent matters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesData.notifications?.discord || false}
                      onChange={handleNotificationChange('discord')}
                    />
                  }
                  label="Discord integration"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferencesData.notifications?.slack || false}
                      onChange={handleNotificationChange('slack')}
                    />
                  }
                  label="Slack notifications"
                />
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Preferences */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                👤 Personal Information
              </Typography>

              <TextField
                fullWidth
                label="Delivery Address (Optional)"
                multiline
                rows={3}
                value={preferencesData.deliveryAddress || ''}
                onChange={handleInputChange('deliveryAddress')}
                helperText="For welcome package and company swag delivery"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>How did you hear about us?</InputLabel>
                <Select
                  value={preferencesData.referralSource || ''}
                  onChange={handleInputChange('referralSource')}
                  error={!!errors.referralSource}
                >
                  {referralSources.map((source) => (
                    <MenuItem key={source} value={source}>
                      {source}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Goals & Expectations"
                multiline
                rows={4}
                value={preferencesData.goals || ''}
                onChange={handleInputChange('goals')}
                placeholder="What are you most excited about? What do you hope to achieve?"
                helperText="Help us understand your motivations and goals"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contact */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🚨 Emergency Contact
              </Typography>
              
              <TextField
                fullWidth
                label="Emergency Contact Name"
                value={preferencesData.emergencyContact?.name || ''}
                onChange={handleEmergencyContactChange('name')}
                error={!!errors['emergencyContact.name']}
                helperText={errors['emergencyContact.name']}
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
                label="Emergency Contact Phone"
                value={preferencesData.emergencyContact?.phone || ''}
                onChange={handleEmergencyContactChange('phone')}
                error={!!errors['emergencyContact.phone']}
                helperText={errors['emergencyContact.phone']}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Relationship"
                value={preferencesData.emergencyContact?.relationship || ''}
                onChange={handleEmergencyContactChange('relationship')}
                placeholder="e.g., Spouse, Parent, Sibling"
                helperText="Relationship to emergency contact"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Compliance */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📋 Legal & Compliance
              </Typography>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  By completing this onboarding, you agree to our terms of employment and authorize the creation of your Web3 employee profile.
                </Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferencesData.complianceAcknowledged || false}
                    onChange={(e) => updateFormData('preferences', { complianceAcknowledged: e.target.checked })}
                  />
                }
                label={
                  <Typography variant="body2">
                    I acknowledge that I have read and agree to the employment terms, privacy policy, and Web3 payroll system usage.
                  </Typography>
                }
                sx={{ mb: 2 }}
              />

              {!preferencesData.complianceAcknowledged && (
                <Alert severity="warning">
                  Please acknowledge the compliance terms to proceed.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Review Summary */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'primary.50', border: 2, borderColor: 'primary.200' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary" fontWeight="bold">
                📋 Onboarding Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary">Identity</Typography>
                    <Typography variant="body2">{formData.identity?.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.identity?.ensSubdomain}.company.eth
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary">Employment</Typography>
                    <Typography variant="body2">{formData.employment?.jobTitle}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.employment?.department} • {formData.employment?.employmentType}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary">Payroll</Typography>
                    <Typography variant="body2">
                      ${parseInt(formData.payroll?.salary || '0').toLocaleString()} {formData.payroll?.currency}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.payroll?.frequency} in {formData.payroll?.preferredToken}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="subtitle2" color="primary">Start Date</Typography>
                    <Typography variant="body2">{formData.employment?.startDate}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.employment?.workLocation}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box mt={3} textAlign="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleCompleteOnboarding}
                  disabled={!preferencesData.complianceAcknowledged || isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                  sx={{
                    minWidth: 250,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    py: 1.5,
                    boxShadow: 4,
                    '&:hover': {
                      boxShadow: 6,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {isSubmitting ? 'Processing...' : '🎉 Complete Onboarding'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submission Dialog */}
      <Dialog
        open={isSubmitDialogOpen}
        onClose={() => !isSubmitting && setIsSubmitDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SecurityIcon color="primary" />
            <Typography variant="h6">
              Complete Web3 Onboarding
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {submissionStatus === 'idle' && (
            <Box>
              <Typography variant="body1" gutterBottom>
                You're about to complete your Web3 employee onboarding! This will:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Create your ENS subdomain" secondary={`${formData.identity?.ensSubdomain}.company.eth`} />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Add you to the payroll smart contract" secondary="Immutable employment record on blockchain" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Request your digital signature" secondary="Web3 signature for contract acceptance" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                  <ListItemText primary="Activate your employee profile" secondary="Ready to receive payments and benefits" />
                </ListItem>
              </List>
            </Box>
          )}

          {submissionStatus === 'signing' && (
            <Box textAlign="center" py={3}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>Requesting Signature</Typography>
              <Typography variant="body2" color="text.secondary">
                Please sign the employment contract with your wallet...
              </Typography>
            </Box>
          )}

          {submissionStatus === 'submitting' && (
            <Box textAlign="center" py={3}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>Creating Your Profile</Typography>
              <Typography variant="body2" color="text.secondary">
                Setting up ENS subdomain and adding you to the smart contract...
              </Typography>
            </Box>
          )}

          {submissionStatus === 'success' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Box textAlign="center" py={3}>
                <DoneIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom color="success.main">
                  🎉 Welcome to the team!
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Your Web3 employee profile has been successfully created!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can now receive payments at {formData.identity?.ensSubdomain}.company.eth
                </Typography>
              </Box>
            </motion.div>
          )}

          {submissionStatus === 'error' && (
            <Box textAlign="center" py={3}>
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Oops! Something went wrong during submission. Please try again.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          {submissionStatus === 'idle' && (
            <>
              <Button onClick={() => setIsSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitConfirm}
                startIcon={<SecurityIcon />}
              >
                Sign & Complete Onboarding
              </Button>
            </>
          )}
          
          {submissionStatus === 'error' && (
            <>
              <Button onClick={() => setIsSubmitDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmitConfirm}
                startIcon={<SecurityIcon />}
              >
                Try Again
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PreferencesStep
