import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Language as ENSIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useAppSelector, useAppDispatch } from '../store/store'
import { setCompanyDomain, setSubdomains, addSubdomain } from '../store/slices/ensSlice'
import { addNotification } from '../store/slices/uiSlice'
import { ENSService } from '../services/ensService'

/**
 * ENS Management page for Web3 Payroll System
 * @author Dev Austin
 */

const ENSManagement: React.FC = () => {
  const { address, isConnected } = useAccount()
  const dispatch = useAppDispatch()
  
  const { companyDomain, subdomains, isLoading, isRegistering, registrationError } = useAppSelector((state) => state.ens)
  
  const [domainName, setDomainName] = useState('')
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [ensService, setEnsService] = useState<ENSService | null>(null)

  // Initialize ENS service (simplified for now)
  useEffect(() => {
    // TODO: Initialize ENS service when provider/signer are available
    setEnsService(null)
  }, [])

  // Mock data for demonstration
  useEffect(() => {
    if (isConnected) {
      // Mock company domain
      const mockCompanyDomain = {
        name: 'testcompany.eth',
        node: '0x1234567890abcdef',
        owner: address || '',
        resolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
        isAvailable: false,
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
      }

      // Mock subdomains
      const mockSubdomains = [
        {
          name: 'alice',
          fullName: 'alice.testcompany.eth',
          node: '0xabc123',
          owner: '0x1234567890123456789012345678901234567890',
          employeeAddress: '0x1234567890123456789012345678901234567890',
          createdAt: Date.now() - 2592000000, // 30 days ago
        },
        {
          name: 'bob',
          fullName: 'bob.testcompany.eth',
          node: '0xdef456',
          owner: '0x9876543210987654321098765432109876543210',
          employeeAddress: '0x9876543210987654321098765432109876543210',
          createdAt: Date.now() - 1728000000, // 20 days ago
        },
      ]

      dispatch(setCompanyDomain(mockCompanyDomain))
      dispatch(setSubdomains(mockSubdomains))
    }
  }, [isConnected, address, dispatch])

  const handleCheckAvailability = async () => {
    if (!ensService || !domainName) return

    try {
      const available = await ensService.checkDomainAvailability(domainName)
      setIsAvailable(available)
      
      if (available) {
        dispatch(addNotification({
          type: 'success',
          title: 'Domain Available',
          message: `${domainName}.eth is available for registration!`
        }))
      } else {
        dispatch(addNotification({
          type: 'warning',
          title: 'Domain Unavailable',
          message: `${domainName}.eth is already taken`
        }))
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to check domain availability'
      }))
    }
  }

  const handleRegisterDomain = async () => {
    if (!ensService || !domainName) return

    try {
      dispatch(addNotification({
        type: 'info',
        title: 'Registering Domain',
        message: `Starting registration process for ${domainName}.eth...`
      }))

      const result = await ensService.registerDomain(domainName)
      
      if (result.success) {
        dispatch(addNotification({
          type: 'success',
          title: 'Domain Registered',
          message: `${domainName}.eth has been registered successfully!`
        }))
        
        // Update company domain in state
        const newDomain = {
          name: `${domainName}.eth`,
          node: '0x' + Math.random().toString(16).substr(2, 8),
          owner: address || '',
          resolver: '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41',
          isAvailable: false,
          expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        }
        dispatch(setCompanyDomain(newDomain))
        setShowRegisterDialog(false)
        setDomainName('')
        setIsAvailable(null)
      } else {
        dispatch(addNotification({
          type: 'error',
          title: 'Registration Failed',
          message: result.error || 'Failed to register domain'
        }))
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Registration Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
    }
  }

  const handleCreateSubdomain = async (subdomainName: string, employeeAddress: string) => {
    if (!ensService || !companyDomain) return

    try {
      const result = await ensService.createSubdomain(
        companyDomain.name,
        subdomainName,
        employeeAddress
      )

      if (result.success) {
        dispatch(addNotification({
          type: 'success',
          title: 'Subdomain Created',
          message: `${subdomainName}.${companyDomain.name} has been created successfully!`
        }))

        // Add to local state
        const newSubdomain = {
          name: subdomainName,
          fullName: `${subdomainName}.${companyDomain.name}`,
          node: '0x' + Math.random().toString(16).substr(2, 8),
          owner: employeeAddress,
          employeeAddress,
          createdAt: Date.now(),
        }
        dispatch(addSubdomain(newSubdomain))
      } else {
        dispatch(addNotification({
          type: 'error',
          title: 'Subdomain Creation Failed',
          message: result.error || 'Failed to create subdomain'
        }))
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Subdomain Error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
    }
  }

  const validateDomainName = (name: string) => {
    if (!name || name.length < 3) {
      return { valid: false, error: 'Domain name must be at least 3 characters long' }
    }
    if (name.length > 63) {
      return { valid: false, error: 'Domain name must be less than 64 characters long' }
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      return { valid: false, error: 'Domain name can only contain lowercase letters, numbers, and hyphens' }
    }
    if (name.startsWith('-') || name.endsWith('-')) {
      return { valid: false, error: 'Domain name cannot start or end with a hyphen' }
    }
    if (name.includes('--')) {
      return { valid: false, error: 'Domain name cannot contain consecutive hyphens' }
    }
    return { valid: true }
  }

  if (!isConnected) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h4" gutterBottom>
          ENS Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect your wallet to manage ENS domains
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          ENS Management
        </Typography>
        {!companyDomain && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowRegisterDialog(true)}
          >
            Register Company Domain
          </Button>
        )}
      </Box>

      {/* Company Domain Status */}
      {companyDomain ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ENSIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Company Domain</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {companyDomain.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Owner: {companyDomain.owner.slice(0, 6)}...{companyDomain.owner.slice(-4)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Expires: {new Date(companyDomain.expiryDate || 0).toLocaleDateString()}
                </Typography>
                <Chip
                  icon={<AvailableIcon />}
                  label="Active"
                  color="success"
                  size="small"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Alert severity="info">
              <Typography variant="h6" gutterBottom>
                No Company Domain Registered
              </Typography>
              <Typography variant="body2">
                Register a company domain to start creating employee subdomains.
                This will allow you to create human-readable addresses like alice.yourcompany.eth
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Subdomains Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Employee Subdomains ({subdomains.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              size="small"
            >
              Refresh
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subdomain</TableCell>
                  <TableCell>Full Name</TableCell>
                  <TableCell>Employee Address</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subdomains.map((subdomain) => (
                  <TableRow key={subdomain.node}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {subdomain.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {subdomain.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {subdomain.employeeAddress.slice(0, 6)}...{subdomain.employeeAddress.slice(-4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(subdomain.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<AvailableIcon />}
                        label="Active"
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Subdomain">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Subdomain">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {subdomains.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No subdomains created yet. Add employees to automatically create their ENS subdomains.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Domain Registration Dialog */}
      <Dialog open={showRegisterDialog} onClose={() => setShowRegisterDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register Company Domain</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Register an ENS domain for your company. This will be used to create employee subdomains.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Domain Name"
              value={domainName}
              onChange={(e) => {
                const value = e.target.value.toLowerCase()
                setDomainName(value)
                setIsAvailable(null)
              }}
              placeholder="yourcompany"
              helperText="Enter domain name without .eth extension"
              error={domainName ? !validateDomainName(domainName).valid : false}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6">.eth</Typography>
            </Box>
          </Box>

          {domainName && validateDomainName(domainName).valid && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={handleCheckAvailability}
                disabled={isLoading}
                fullWidth
              >
                Check Availability
              </Button>
            </Box>
          )}

          {isAvailable !== null && (
            <Alert 
              severity={isAvailable ? 'success' : 'warning'} 
              sx={{ mb: 2 }}
              icon={isAvailable ? <AvailableIcon /> : <UnavailableIcon />}
            >
              {isAvailable 
                ? `${domainName}.eth is available for registration!`
                : `${domainName}.eth is already taken`
              }
            </Alert>
          )}

          {domainName && !validateDomainName(domainName).valid && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validateDomainName(domainName).error}
            </Alert>
          )}

          {isRegistering && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Registering domain...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {registrationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {registrationError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRegisterDomain}
            variant="contained"
            disabled={!isAvailable || isRegistering || !domainName}
          >
            {isRegistering ? 'Registering...' : `Register ${domainName}.eth`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ENSManagement
