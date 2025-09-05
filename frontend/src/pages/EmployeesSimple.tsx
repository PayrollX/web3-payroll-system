import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Stack,
  Divider,
  alpha,
  useTheme
} from '@mui/material'
import {
  Add as AddIcon,
  Person as PersonIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  Dns as DnsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import { useAccount } from 'wagmi'

/**
 * Simple Employee Management for Employers
 * Only company owners access this - employees never login
 * @author Dev Austin
 */

interface Employee {
  id: string
  name: string
  email: string
  position: string
  department: string
  walletAddress: string
  salary: string
  paymentFrequency: string
  preferredToken: string
  ensDomain: string
  isActive: boolean
  lastPayment?: string
  createdAt: string
}

interface AddEmployeeData {
  name: string
  email: string
  position: string
  department: string
  walletAddress: string
  salaryAmount: string
  paymentFrequency: string
  preferredToken: string
  phone?: string
}

const paymentFrequencies = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' }
]

const supportedTokens = [
  { value: 'ETH', label: 'Ethereum (ETH)' },
  { value: 'USDC', label: 'USD Coin (USDC)' },
  { value: 'USDT', label: 'Tether (USDT)' },
  { value: 'DAI', label: 'Dai Stablecoin (DAI)' }
]

const EmployeesSimple: React.FC = () => {
  const theme = useTheme()
  const { address, isConnected } = useAccount()

  // State management
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form data for adding new employee
  const [formData, setFormData] = useState<AddEmployeeData>({
    name: '',
    email: '',
    position: '',
    department: '',
    walletAddress: '',
    salaryAmount: '',
    paymentFrequency: 'MONTHLY',
    preferredToken: 'ETH',
    phone: ''
  })

  // Load employees on component mount
  useEffect(() => {
    if (isConnected && address) {
      loadEmployees()
    }
  }, [isConnected, address])

  // Load employees from backend
  const loadEmployees = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/employees', {
        headers: {
          'x-wallet-address': address!
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load employees')
      }
    } catch (error) {
      setError('Network error while loading employees')
    } finally {
      setLoading(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: keyof AddEmployeeData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Add new employee
  const handleAddEmployee = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first')
      return
    }

    // Basic validation
    if (!formData.name || !formData.email || !formData.walletAddress || 
        !formData.position || !formData.department || !formData.salaryAmount) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Add new employee to list
        const newEmployee: Employee = {
          id: data.employee.id,
          name: data.employee.name,
          email: data.employee.email,
          position: data.employee.position,
          department: data.employee.department,
          walletAddress: data.employee.walletAddress,
          salary: data.employee.salary,
          paymentFrequency: data.employee.paymentFrequency,
          preferredToken: formData.preferredToken,
          ensDomain: data.employee.ensDomain,
          isActive: data.employee.isActive,
          createdAt: data.employee.createdAt
        }

        setEmployees(prev => [newEmployee, ...prev])
        setAddDialogOpen(false)
        resetForm()
        
        // Show success message
        alert(`Employee ${data.employee.name} added successfully!\nENS Domain: ${data.employee.ensDomain}`)
      } else {
        setError(data.message || data.error || 'Failed to add employee')
      }
    } catch (error) {
      setError('Network error while adding employee')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      position: '',
      department: '',
      walletAddress: '',
      salaryAmount: '',
      paymentFrequency: 'MONTHLY',
      preferredToken: 'ETH',
      phone: ''
    })
    setError(null)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  // Format salary display
  const formatSalary = (amount: string, token: string) => {
    return `${parseFloat(amount).toLocaleString()} ${token}`
  }

  // Get status chip color
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'error'
  }

  if (!isConnected) {
    return (
      <Box textAlign="center" py={8}>
        <WalletIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Connect Your Wallet
        </Typography>
        <Typography color="text.secondary">
          Please connect your wallet to manage employees
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Employee Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Add employees and manage payroll. Employees will automatically receive ENS domains.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{employees.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <PaymentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{employees.filter(e => e.isActive).length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Employees
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <DnsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{employees.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ENS Domains
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WalletIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {employees.reduce((total, emp) => total + parseFloat(emp.salary || '0'), 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Monthly Payroll
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          size="large"
        >
          Add Employee
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadEmployees}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Employee Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box textAlign="center" py={4}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" mt={2}>
                Loading employees...
              </Typography>
            </Box>
          ) : employees.length === 0 ? (
            <Box textAlign="center" py={8}>
              <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No employees yet
              </Typography>
              <Typography color="text.secondary" mb={3}>
                Add your first employee to get started with payroll management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddDialogOpen(true)}
              >
                Add First Employee
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>ENS Domain</TableCell>
                    <TableCell>Salary</TableCell>
                    <TableCell>Frequency</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                            {employee.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {employee.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {employee.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.position}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {employee.ensDomain}
                          </Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => copyToClipboard(employee.ensDomain)}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatSalary(employee.salary, employee.preferredToken)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.paymentFrequency}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.isActive ? 'Active' : 'Inactive'}
                          color={getStatusColor(employee.isActive)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Add New Employee
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Add a new employee to your payroll. They will automatically receive an ENS domain.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wallet Address"
                value={formData.walletAddress}
                onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                required
                margin="normal"
                helperText="The employee's Ethereum wallet address where they'll receive payments"
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Salary Amount"
                type="number"
                value={formData.salaryAmount}
                onChange={(e) => handleInputChange('salaryAmount', e.target.value)}
                required
                margin="normal"
                helperText="Amount per payment period"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Frequency</InputLabel>
                <Select
                  value={formData.paymentFrequency}
                  label="Payment Frequency"
                  onChange={(e) => handleInputChange('paymentFrequency', e.target.value)}
                >
                  {paymentFrequencies.map(freq => (
                    <MenuItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Token</InputLabel>
                <Select
                  value={formData.preferredToken}
                  label="Payment Token"
                  onChange={(e) => handleInputChange('preferredToken', e.target.value)}
                >
                  {supportedTokens.map(token => (
                    <MenuItem key={token.value} value={token.value}>
                      {token.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddEmployee}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeesSimple
