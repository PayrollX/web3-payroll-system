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
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useAppDispatch } from '../store/store'
import { addNotification } from '../store/slices/uiSlice'
import { useBlockchain } from '../hooks/useBlockchain'
import { useEmployees } from '../hooks/useApi'
import { EmployeeOnboardingForm } from '../components/EmployeeOnboarding'
import { 
  TOKEN_ADDRESSES, 
  NETWORKS, 
  PAYMENT_FREQUENCIES, 
  PAYMENT_FREQUENCY_LABELS,
  TOKEN_INFO,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  VALIDATION
} from '../contracts/constants'

/**
 * Professional Employee Management page for Web3 Payroll System
 * @author Dev Austin
 */

interface EmployeeFormData {
  personalInfo: {
    name: string
    email: string
    phone: string
  }
  employmentDetails: {
    position: string
    department: string
    employmentType: 'full-time' | 'part-time' | 'contractor'
  }
  payrollSettings: {
    walletAddress: string
    salaryAmount: string
    paymentFrequency: number
    preferredToken: string
  }
  ensDetails: {
    subdomain: string
  }
}

const Employees: React.FC = () => {
  const { address, isConnected } = useAccount()
  const dispatch = useAppDispatch()
  
  // Blockchain hooks
  const {
    isOwner,
    currentNetwork,
    employees: blockchainEmployees,
    loadingEmployees,
    addEmployee: addEmployeeToBlockchain,
    refreshData,
  } = useBlockchain()
  
  // API hooks
  const {
    employees: apiEmployees,
    totalEmployees,
    activeEmployees,
    loading: apiLoading,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    refreshEmployees,
  } = useEmployees()
  
  // Local state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [formData, setFormData] = useState<EmployeeFormData>({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
    },
    employmentDetails: {
      position: '',
      department: '',
      employmentType: 'full-time',
    },
    payrollSettings: {
      walletAddress: '',
      salaryAmount: '',
      paymentFrequency: PAYMENT_FREQUENCIES.MONTHLY,
      preferredToken: TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]?.ETH || '0x0000000000000000000000000000000000000000',
    },
    ensDetails: {
      subdomain: '',
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Personal info validation
    if (!formData.personalInfo.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.personalInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!VALIDATION.EMAIL_REGEX.test(formData.personalInfo.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Employment details validation
    if (!formData.employmentDetails.position.trim()) {
      newErrors.position = 'Position is required'
    }
    if (!formData.employmentDetails.department.trim()) {
      newErrors.department = 'Department is required'
    }

    // Payroll settings validation
    if (!formData.payrollSettings.walletAddress.trim()) {
      newErrors.walletAddress = 'Wallet address is required'
    } else if (!VALIDATION.ADDRESS_REGEX.test(formData.payrollSettings.walletAddress)) {
      newErrors.walletAddress = 'Invalid wallet address'
    }
    if (!formData.payrollSettings.salaryAmount.trim()) {
      newErrors.salaryAmount = 'Salary amount is required'
    } else {
      const salary = parseFloat(formData.payrollSettings.salaryAmount)
      if (isNaN(salary) || salary < VALIDATION.MIN_SALARY || salary > VALIDATION.MAX_SALARY) {
        newErrors.salaryAmount = `Salary must be between ${VALIDATION.MIN_SALARY} and ${VALIDATION.MAX_SALARY} ETH`
      }
    }

    // ENS details validation
    if (!formData.ensDetails.subdomain.trim()) {
      newErrors.subdomain = 'ENS subdomain is required'
    } else if (
      formData.ensDetails.subdomain.length < VALIDATION.ENS_SUBDOMAIN_MIN_LENGTH ||
      formData.ensDetails.subdomain.length > VALIDATION.ENS_SUBDOMAIN_MAX_LENGTH
    ) {
      newErrors.subdomain = `Subdomain must be between ${VALIDATION.ENS_SUBDOMAIN_MIN_LENGTH} and ${VALIDATION.ENS_SUBDOMAIN_MAX_LENGTH} characters`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form input change
   */
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field as keyof EmployeeFormData],
        ...value,
      },
    }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }))
    }
  }

  /**
   * Handle add employee
   */
  const handleAddEmployee = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // First, add to blockchain
      const blockchainResult = await addEmployeeToBlockchain({
        employee: formData.payrollSettings.walletAddress,
        salary: formData.payrollSettings.salaryAmount,
        subdomain: formData.ensDetails.subdomain,
        frequency: formData.payrollSettings.paymentFrequency,
        token: formData.payrollSettings.preferredToken,
        position: formData.employmentDetails.position,
        department: formData.employmentDetails.department,
      })

      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Failed to add employee to blockchain')
      }

      // Then, add to API
      const apiResult = await createEmployee({
        personalInfo: formData.personalInfo,
        employmentDetails: {
          ...formData.employmentDetails,
          startDate: new Date().toISOString(),
          isActive: true,
        },
        payrollSettings: {
          ...formData.payrollSettings,
          paymentFrequency: PAYMENT_FREQUENCY_LABELS[formData.payrollSettings.paymentFrequency as keyof typeof PAYMENT_FREQUENCY_LABELS] as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY',
          lastPaymentTimestamp: 0,
        },
        ensDetails: {
          ...formData.ensDetails,
          fullDomain: `${formData.ensDetails.subdomain}.company.eth`,
          ensNode: '0x0000000000000000000000000000000000000000000000000000000000000000', // Will be updated
        },
        taxInformation: {
          withholdings: 0,
          taxExempt: false,
        },
        blockchainInfo: {
          transactionHash: blockchainResult.transactionHash,
        },
      })

      if (!apiResult) {
        throw new Error('Failed to add employee to database')
      }

      dispatch(addNotification({
        type: 'success',
        title: 'Employee Added',
        message: SUCCESS_MESSAGES.EMPLOYEE_ADDED,
      }))

      setShowAddDialog(false)
      resetForm()
      await refreshEmployees()
      await refreshData()
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle edit employee
   */
  const handleEditEmployee = async () => {
    if (!selectedEmployee || !validateForm()) return

    setLoading(true)
    try {
      const result = await updateEmployee(selectedEmployee._id, {
        personalInfo: formData.personalInfo,
        employmentDetails: {
          ...formData.employmentDetails,
          startDate: selectedEmployee.employmentDetails.startDate,
          isActive: selectedEmployee.employmentDetails.isActive,
        },
        payrollSettings: {
          ...formData.payrollSettings,
          paymentFrequency: PAYMENT_FREQUENCY_LABELS[formData.payrollSettings.paymentFrequency as keyof typeof PAYMENT_FREQUENCY_LABELS] as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY',
          lastPaymentTimestamp: selectedEmployee.payrollSettings.lastPaymentTimestamp,
        },
        ensDetails: {
          ...formData.ensDetails,
          fullDomain: `${formData.ensDetails.subdomain}.company.eth`,
          ensNode: selectedEmployee.ensDetails.ensNode,
          resolverAddress: selectedEmployee.ensDetails.resolverAddress,
        },
      })

      if (result) {
        dispatch(addNotification({
                  type: 'success',
        title: 'Employee Updated',
        message: 'Employee updated successfully',
        }))
        setShowEditDialog(false)
        resetForm()
        await refreshEmployees()
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Open edit dialog for employee
   */
  const openEditDialog = (employee: any) => {
    setSelectedEmployee(employee)
    setFormData({
      personalInfo: employee.personalInfo,
      employmentDetails: {
        position: employee.employmentDetails.position,
        department: employee.employmentDetails.department,
        employmentType: employee.employmentDetails.employmentType,
      },
      payrollSettings: {
        walletAddress: employee.payrollSettings.walletAddress,
        salaryAmount: employee.payrollSettings.salaryAmount,
        paymentFrequency: employee.payrollSettings.paymentFrequency,
        preferredToken: employee.payrollSettings.preferredToken,
      },
      ensDetails: {
        subdomain: employee.ensDetails?.subdomain || '',
      },
    })
    setShowEditDialog(true)
  }

  /**
   * Handle view mode toggle
   */
  const handleViewModeToggle = () => {
    setViewMode(prev => prev === 'table' ? 'list' : 'table')
  }

  /**
   * Handle active filter toggle
   */
  const handleActiveFilterToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowActiveOnly(event.target.checked)
  }

  /**
   * Get filtered employees
   */
  const getFilteredEmployees = () => {
    if (!apiEmployees || !Array.isArray(apiEmployees)) return []
    if (!showActiveOnly) return apiEmployees
    return apiEmployees.filter(emp => emp.employmentDetails.isActive)
  }

  /**
   * Handle delete employee
   */
  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return

    setLoading(true)
    try {
      const result = await deleteEmployee(employeeId)
      if (result) {
        dispatch(addNotification({
                  type: 'success',
        title: 'Employee Deleted',
        message: 'Employee deleted successfully',
        }))
        await refreshEmployees()
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle toggle employee status
   */
  const handleToggleEmployeeStatus = async (employee: any) => {
    setLoading(true)
    try {
      const result = employee.employmentDetails.isActive
        ? await deactivateEmployee(employee._id)
        : await activateEmployee(employee._id)

      if (result) {
        dispatch(addNotification({
                  type: 'success',
        title: 'Employee Status Updated',
        message: `Employee ${employee.employmentDetails.isActive ? 'deactivated' : 'activated'} successfully`,
        }))
        await refreshEmployees()
      }
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      personalInfo: {
        name: '',
        email: '',
        phone: '',
      },
      employmentDetails: {
        position: '',
        department: '',
        employmentType: 'full-time',
      },
      payrollSettings: {
        walletAddress: '',
        salaryAmount: '',
        paymentFrequency: PAYMENT_FREQUENCIES.MONTHLY,
        preferredToken: TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]?.ETH || '0x0000000000000000000000000000000000000000',
      },
      ensDetails: {
        subdomain: '',
      },
    })
    setErrors({})
    setSelectedEmployee(null)
  }

  // Update filtered employees when filter changes
  useEffect(() => {
    // This effect ensures the filtered employee list updates when the filter changes
    const filteredCount = getFilteredEmployees().length
    console.log(`Filtered employees: ${filteredCount}`)
  }, [showActiveOnly, apiEmployees])


  /**
   * Open view dialog
   */
  const openViewDialog = (employee: any) => {
    setSelectedEmployee(employee)
    setShowViewDialog(true)
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount)
    return isNaN(num) ? '0.0000' : num.toFixed(4)
  }

  /**
   * Get token symbol
   */
  const getTokenSymbol = (tokenAddress: string) => {
    if (!currentNetwork) return 'UNKNOWN'
    
    const networkTokens = TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]
    if (!networkTokens) return 'UNKNOWN'
    
    const token = Object.values(TOKEN_INFO).find(t => {
      const tokenKey = t.symbol as keyof typeof networkTokens
      return networkTokens[tokenKey] === tokenAddress
    })
    return token?.symbol || 'UNKNOWN'
  }

  if (!isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Employee Management
        </Typography>
        <Alert severity="info">
          Please connect your wallet to manage employees.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Employee Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your team members and their payroll settings
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => { refreshEmployees(); refreshData(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            disabled={!isOwner}
          >
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* View Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showActiveOnly}
                onChange={handleActiveFilterToggle}
                color="primary"
              />
            }
            label="Show Active Only"
          />
          <Divider orientation="vertical" flexItem />
          <Tooltip title="Toggle View Mode">
            <IconButton onClick={handleViewModeToggle}>
              {viewMode === 'table' ? <VisibilityIcon /> : <PersonIcon />}
            </IconButton>
          </Tooltip>
          <Typography variant="body2" color="text.secondary">
            View: {viewMode === 'table' ? 'Table' : 'List'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Showing {getFilteredEmployees().length} of {apiEmployees?.length || 0} employees
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {totalEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {activeEmployees}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {blockchainEmployees.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    On Blockchain
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Employees Display */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Employees {viewMode === 'table' ? 'Table' : 'List'}
          </Typography>
          
          {apiLoading || loadingEmployees ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : getFilteredEmployees().length === 0 ? (
            <Alert severity="info">
              {showActiveOnly ? 'No active employees found.' : 'No employees found. Add your first employee to get started.'}
            </Alert>
          ) : viewMode === 'table' ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Salary</TableCell>
                    <TableCell>ENS Domain</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredEmployees().map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {employee.personalInfo.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {employee.personalInfo.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {employee.personalInfo.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{employee.employmentDetails.position}</TableCell>
                      <TableCell>{employee.employmentDetails.department}</TableCell>
                      <TableCell>
                        {formatCurrency(employee.payrollSettings.salaryAmount)} {getTokenSymbol(employee.payrollSettings.preferredToken)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {employee.ensDetails.fullDomain}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.employmentDetails.isActive ? 'Active' : 'Inactive'}
                          color={employee.employmentDetails.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => openViewDialog(employee)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Employee">
                            <IconButton 
                              size="small" 
                              onClick={() => openEditDialog(employee)}
                              disabled={!isOwner || !employee._id}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={employee.employmentDetails.isActive ? 'Deactivate' : 'Activate'}>
                            <IconButton 
                              size="small" 
                              onClick={() => employee._id && handleToggleEmployeeStatus(employee)}
                              disabled={!isOwner || !employee._id}
                            >
                              {employee.employmentDetails.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Employee">
                            <IconButton 
                              size="small" 
                              onClick={() => employee._id && handleDeleteEmployee(employee._id)}
                              disabled={!isOwner || !employee._id}
                              color="error"
                            >
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
          ) : (
            /* List View */
            <List>
              {getFilteredEmployees().map((employee, index) => (
                <React.Fragment key={employee._id}>
                  <ListItem>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {employee.personalInfo.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {employee.personalInfo.name}
                          </Typography>
                          <Chip
                            label={employee.employmentDetails.isActive ? 'Active' : 'Inactive'}
                            color={employee.employmentDetails.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {employee.employmentDetails.position} • {employee.employmentDetails.department}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(employee.payrollSettings.salaryAmount)} {getTokenSymbol(employee.payrollSettings.preferredToken)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                            {employee.ensDetails.fullDomain}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => {
                            setSelectedEmployee(employee)
                            setShowViewDialog(true)
                          }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Employee">
                          <IconButton size="small" onClick={() => openEditDialog(employee)} disabled={!isOwner}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Employee">
                          <IconButton 
                            size="small" 
                            onClick={() => employee._id && handleDeleteEmployee(employee._id)}
                            disabled={!isOwner || !employee._id}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < getFilteredEmployees().length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.personalInfo.name}
                onChange={(e) => handleInputChange('personalInfo', { name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handleInputChange('personalInfo', { email: e.target.value })}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo', { phone: e.target.value })}
              />
            </Grid>

            {/* Employment Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Employment Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.employmentDetails.position}
                onChange={(e) => handleInputChange('employmentDetails', { position: e.target.value })}
                error={!!errors.position}
                helperText={errors.position}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.employmentDetails.department}
                onChange={(e) => handleInputChange('employmentDetails', { department: e.target.value })}
                error={!!errors.department}
                helperText={errors.department}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employmentDetails.employmentType}
                  onChange={(e) => handleInputChange('employmentDetails', { employmentType: e.target.value })}
                >
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Payroll Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Payroll Settings</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wallet Address"
                value={formData.payrollSettings.walletAddress}
                onChange={(e) => handleInputChange('payrollSettings', { walletAddress: e.target.value })}
                error={!!errors.walletAddress}
                helperText={errors.walletAddress}
                placeholder="0x..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary Amount (ETH)"
                type="number"
                value={formData.payrollSettings.salaryAmount}
                onChange={(e) => handleInputChange('payrollSettings', { salaryAmount: e.target.value })}
                error={!!errors.salaryAmount}
                helperText={errors.salaryAmount}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Frequency</InputLabel>
                <Select
                  value={formData.payrollSettings.paymentFrequency}
                  onChange={(e) => handleInputChange('payrollSettings', { paymentFrequency: e.target.value })}
                >
                  {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={parseInt(value)}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred Token</InputLabel>
                <Select
                  value={formData.payrollSettings.preferredToken}
                  onChange={(e) => handleInputChange('payrollSettings', { preferredToken: e.target.value })}
                >
                  {Object.entries(TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES] || {}).map(([symbol, address]) => (
                    <MenuItem key={address} value={address}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ENS Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>ENS Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ENS Subdomain"
                value={formData.ensDetails.subdomain}
                onChange={(e) => handleInputChange('ensDetails', { subdomain: e.target.value })}
                error={!!errors.subdomain}
                helperText={errors.subdomain}
                placeholder="alice"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Domain"
                value={`${formData.ensDetails.subdomain}.company.eth`}
                disabled
                helperText="This will be the employee's ENS domain"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddEmployee} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Personal Information</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.personalInfo.name}
                onChange={(e) => handleInputChange('personalInfo', { name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.personalInfo.email}
                onChange={(e) => handleInputChange('personalInfo', { email: e.target.value })}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo', { phone: e.target.value })}
              />
            </Grid>

            {/* Employment Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Employment Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={formData.employmentDetails.position}
                onChange={(e) => handleInputChange('employmentDetails', { position: e.target.value })}
                error={!!errors.position}
                helperText={errors.position}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.employmentDetails.department}
                onChange={(e) => handleInputChange('employmentDetails', { department: e.target.value })}
                error={!!errors.department}
                helperText={errors.department}
              />
            </Grid>

            {/* Payroll Settings */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Payroll Settings</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Salary Amount"
                type="number"
                value={formData.payrollSettings.salaryAmount}
                onChange={(e) => handleInputChange('payrollSettings', { salaryAmount: e.target.value })}
                error={!!errors.salaryAmount}
                helperText={errors.salaryAmount}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Frequency</InputLabel>
                <Select
                  value={formData.payrollSettings.paymentFrequency}
                  onChange={(e) => handleInputChange('payrollSettings', { paymentFrequency: e.target.value as number })}
                >
                  {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={parseInt(value)}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ENS Details */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>ENS Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ENS Subdomain"
                value={formData.ensDetails.subdomain}
                onChange={(e) => handleInputChange('ensDetails', { subdomain: e.target.value })}
                error={!!errors.subdomain}
                helperText={errors.subdomain}
                placeholder="alice"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Domain"
                value={`${formData.ensDetails.subdomain}.company.eth`}
                disabled
                helperText="This will be the employee's ENS domain"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleEditEmployee} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={showViewDialog} onClose={() => setShowViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                <Typography variant="body1">{selectedEmployee.personalInfo.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{selectedEmployee.personalInfo.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Position</Typography>
                <Typography variant="body1">{selectedEmployee.employmentDetails.position}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                <Typography variant="body1">{selectedEmployee.employmentDetails.department}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Wallet Address</Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {selectedEmployee.payrollSettings.walletAddress}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">ENS Domain</Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {selectedEmployee.ensDetails.fullDomain}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Salary</Typography>
                <Typography variant="body1">
                  {formatCurrency(selectedEmployee.payrollSettings.salaryAmount)} {getTokenSymbol(selectedEmployee.payrollSettings.preferredToken)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Payment Frequency</Typography>
                <Typography variant="body1">
                  {PAYMENT_FREQUENCY_LABELS[selectedEmployee.payrollSettings.paymentFrequency as keyof typeof PAYMENT_FREQUENCY_LABELS]}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Employees