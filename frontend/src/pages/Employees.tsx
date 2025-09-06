import React, { useState } from 'react'
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
  Avatar,
  Stack,
  LinearProgress,
  Skeleton,
  useTheme,
  alpha,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  TablePagination,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  Dns as ENSIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  Launch as LaunchIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useAppDispatch } from '../store/store'
import { addNotification } from '../store/slices/uiSlice'
import { useBlockchain } from '../hooks/useBlockchain'
import { useEmployees } from '../hooks/useApi'
import {
  PAYMENT_FREQUENCY_LABELS,
  TOKEN_INFO,
} from '../contracts/constants'

/**
 * Professional Employee Management page for Web3 Payroll System
 * @author Dev Austin
 */

const EmployeesNew: React.FC = () => {
  const theme = useTheme()
  const { isConnected } = useAccount()
  const dispatch = useAppDispatch()

  // Blockchain hooks
  const { isOwner, refreshData } = useBlockchain()

  // API hooks
  const {
    employees: apiEmployees,
    totalEmployees,
    activeEmployees,
    loading: apiLoading,
    error: apiError,
    refreshEmployees,
    createEmployee,
  } = useEmployees()
  
  // Local state
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Add Employee Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    phone: '',
    // Employment Details
    position: '',
    department: '',
    employmentType: 'full-time' as 'full-time' | 'part-time' | 'contractor',
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    // Payroll Settings
    walletAddress: '',
    salaryAmount: '',
    paymentFrequency: 'MONTHLY' as 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ONE_TIME',
    preferredToken: 'ETH',
    // ENS Details
    subdomain: '',
    // Tax Information
    withholdings: 0,
    taxExempt: false,
  })

  // Helper functions
  const getTokenSymbol = (tokenAddress: string) => {
    const token = Object.values(TOKEN_INFO).find(
      t => 'address' in t && (t as { address: string }).address === tokenAddress
    )
    return token?.symbol || 'ETH'
  }

  const isValidWalletAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const getFilteredEmployees = () => {
    if (!apiEmployees) return []
    
    return apiEmployees.filter(employee => {
      const matchesSearch = !searchTerm || 
        employee.personalInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = filterDepartment === 'all' || 
        employee.employmentDetails?.department === filterDepartment
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && employee.employmentDetails?.isActive) ||
        (filterStatus === 'inactive' && !employee.employmentDetails?.isActive)
      
      return matchesSearch && matchesDepartment && matchesStatus
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([refreshEmployees(), refreshData()])
      dispatch(addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'Employee data has been refreshed successfully.',
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh employee data. Please try again.',
      }))
    } finally {
      setRefreshing(false)
    }
  }

  // Add Employee Functions
  const handleAddEmployeeOpen = () => {
    setAddDialogOpen(true)
  }

  const handleAddEmployeeClose = () => {
    setAddDialogOpen(false)
    // Reset form data
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      employmentType: 'full-time',
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      walletAddress: '',
      salaryAmount: '',
      paymentFrequency: 'MONTHLY',
      preferredToken: 'ETH',
      subdomain: '',
      withholdings: 0,
      taxExempt: false,
    })
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddEmployee = async () => {
    setSubmitting(true)
    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.walletAddress || 
          !formData.position || !formData.department || !formData.salaryAmount) {
        dispatch(addNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please fill in all required fields.',
        }))
        return
      }

      // Validate email format
      if (!isValidEmail(formData.email)) {
        dispatch(addNotification({
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
        }))
        return
      }

      // Validate wallet address format
      if (!isValidWalletAddress(formData.walletAddress)) {
        dispatch(addNotification({
          type: 'error',
          title: 'Invalid Wallet Address',
          message: 'Please enter a valid Ethereum wallet address.',
        }))
        return
      }

      // Validate salary amount
      const salaryNum = parseFloat(formData.salaryAmount)
      if (isNaN(salaryNum) || salaryNum <= 0) {
        dispatch(addNotification({
          type: 'error',
          title: 'Invalid Salary',
          message: 'Please enter a valid salary amount greater than 0.',
        }))
        return
      }

      // Prepare employee data
      const employeeData = {
        personalInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        employmentDetails: {
          startDate: formData.startDate,
          position: formData.position,
          department: formData.department,
          employmentType: formData.employmentType,
          isActive: formData.isActive,
        },
        payrollSettings: {
          walletAddress: formData.walletAddress,
          salaryAmount: formData.salaryAmount,
          paymentFrequency: formData.paymentFrequency,
          preferredToken: formData.preferredToken,
          lastPaymentTimestamp: 0,
        },
        ensDetails: {
          subdomain: formData.subdomain || formData.name.toLowerCase().replace(/\s+/g, ''),
          fullDomain: `${formData.subdomain || formData.name.toLowerCase().replace(/\s+/g, '')}.company.eth`,
          ensNode: '',
        },
        taxInformation: {
          withholdings: formData.withholdings,
          taxExempt: formData.taxExempt,
        },
      }

      const success = await createEmployee(employeeData)
      
      if (success) {
        dispatch(addNotification({
          type: 'success',
          title: 'Employee Added',
          message: `${formData.name} has been successfully added to the system.`,
        }))
        handleAddEmployeeClose()
      } else {
        dispatch(addNotification({
          type: 'error',
          title: 'Add Employee Failed',
          message: 'Failed to add employee. Please try again.',
        }))
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Add Employee Failed',
        message: 'An error occurred while adding the employee.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: 'calc(100vh - 200px)',
        textAlign: 'center'
      }}>
        <Paper sx={{ p: 4, maxWidth: 400, borderRadius: 3 }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Connect Your Wallet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please connect your wallet to access employee management features.
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Make sure you're connected to the correct network for your company.
          </Alert>
        </Paper>
      </Box>
    )
  }

  // Enhanced Metric Card Component
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color = 'primary', 
    loading = false,
    action = null 
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    loading?: boolean
    action?: React.ReactNode
  }) => (
    <Card sx={{ 
      height: '100%', 
      background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)}, ${alpha(theme.palette[color].main, 0.02)})`,
      border: `1px solid ${alpha(theme.palette[color].main, 0.1)}`,
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${alpha(theme.palette[color].main, 0.15)}`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette[color].main, 0.1), 
              color: `${color}.main`,
              width: 48,
              height: 48,
              mr: 2
            }}>
              {icon}
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                {title}
              </Typography>
            </Box>
          </Box>
          {action}
        </Box>
        
        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main`, mb: 1 }}>
            {value}
          </Typography>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Box>
      {/* Loading Progress Bar */}
      {(refreshing || apiLoading) && (
        <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />
      )}
      
      {/* Welcome Header */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Employee Management 👥
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
            Manage your team members and their payroll settings
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<CheckCircleIcon />}
              label={`${activeEmployees} Active`}
              color="primary"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Total: {totalEmployees} employees
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                borderRadius: 2
              }}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!isOwner}
              onClick={handleAddEmployeeOpen}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                borderRadius: 2
              }}
            >
              Add Employee
            </Button>
          </Stack>
        </Box>
        
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          opacity: 0.5
        }} />
      </Paper>

      {/* System Status Alerts */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {apiError && (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />} 
            sx={{ borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={refreshEmployees}>
                Retry
              </Button>
            }
          >
            Error loading employees: {apiError}
          </Alert>
        )}

        {!isOwner && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
            You are viewing as a non-owner. Some administrative functions are not available.
          </Alert>
        )}
      </Stack>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Employees"
            value={totalEmployees}
            subtitle={`${activeEmployees} currently active`}
            icon={<PeopleIcon />}
            color="primary"
            loading={apiLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Active Employees"
            value={activeEmployees}
            subtitle="Currently receiving payments"
            icon={<TrendingUpIcon />}
            color="success"
            loading={apiLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Departments"
            value={Array.from(new Set(apiEmployees?.map(emp => emp.employmentDetails?.department).filter(Boolean) || [])).length}
            subtitle="Unique departments"
            icon={<WorkIcon />}
            color="secondary"
            loading={apiLoading}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="ENS Domains"
            value={apiEmployees?.filter(emp => emp.ensDetails?.fullDomain).length || 0}
            subtitle="With ENS addresses"
            icon={<ENSIcon />}
            color="warning"
            loading={apiLoading}
          />
        </Grid>
      </Grid>

      {/* Search and Filter Controls */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                label="Department"
              >
                <MenuItem value="all">All Departments</MenuItem>
                {Array.from(new Set(apiEmployees?.map(emp => emp.employmentDetails?.department).filter(Boolean) || [])).map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  setSearchTerm('')
                  setFilterDepartment('all')
                  setFilterStatus('all')
                }}
              >
                Clear
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Employee Table */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Employee Directory ({getFilteredEmployees().length})
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1}>
              <Tooltip title="Download CSV">
                <IconButton>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Launch External">
                <IconButton>
                  <LaunchIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        />
        
        {apiLoading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading employees...
            </Typography>
          </Box>
        ) : getFilteredEmployees().length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No employees found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {apiEmployees?.length === 0 
                ? "Get started by adding your first employee."
                : "Try adjusting your search or filter criteria."
              }
            </Typography>
            {isOwner && apiEmployees?.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
              >
                Add First Employee
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Wallet Address</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Salary</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ENS Domain</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredEmployees()
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((employee) => (
                    <TableRow 
                      key={employee._id}
                      sx={{ 
                        '&:hover': { backgroundColor: 'grey.50' },
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {employee.personalInfo?.name?.charAt(0)?.toUpperCase() || 'E'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {employee.personalInfo?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.personalInfo?.email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {employee.employmentDetails?.position || 'Not specified'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {employee.employmentDetails?.department || 'No department'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {employee.payrollSettings?.walletAddress 
                            ? `${employee.payrollSettings.walletAddress.slice(0, 6)}...${employee.payrollSettings.walletAddress.slice(-4)}`
                            : 'Not set'
                          }
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {employee.payrollSettings?.salaryAmount || '0'} {getTokenSymbol(employee.payrollSettings?.preferredToken || '')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {PAYMENT_FREQUENCY_LABELS[employee.payrollSettings?.paymentFrequency as unknown as keyof typeof PAYMENT_FREQUENCY_LABELS] || 'Monthly'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {employee.ensDetails?.fullDomain ? (
                          <Chip
                            icon={<ENSIcon />}
                            label={employee.ensDetails.fullDomain}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No ENS
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={employee.employmentDetails?.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                          label={employee.employmentDetails?.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={employee.employmentDetails?.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {isOwner && (
                            <>
                              <Tooltip title="Edit Employee">
                                <IconButton size="small">
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Toggle Status">
                                <IconButton 
                                  size="small"
                                  color={employee.employmentDetails?.isActive ? "error" : "success"}
                                >
                                  {employee.employmentDetails?.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={getFilteredEmployees().length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </Card>

      {/* Add Employee Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={handleAddEmployeeClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <AddIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Add New Employee
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a new employee profile with payroll settings
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* Personal Information Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight={600}>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                required
                error={!formData.name}
                helperText={!formData.name ? 'Name is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                required
                error={Boolean(!formData.email || (formData.email && !isValidEmail(formData.email)))}
                helperText={
                  !formData.email 
                    ? 'Email is required' 
                    : formData.email && !isValidEmail(formData.email)
                    ? 'Please enter a valid email address'
                    : ''
                }
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </Grid>

            {/* Employment Details Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight={600} sx={{ mt: 2 }}>
                Employment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position/Title"
                value={formData.position}
                onChange={(e) => handleFormChange('position', e.target.value)}
                required
                error={!formData.position}
                helperText={!formData.position ? 'Position is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => handleFormChange('department', e.target.value)}
                required
                error={!formData.department}
                helperText={!formData.department ? 'Department is required' : ''}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Employment Type</InputLabel>
                <Select
                  value={formData.employmentType}
                  label="Employment Type"
                  onChange={(e) => handleFormChange('employmentType', e.target.value)}
                >
                  <MenuItem value="full-time">Full-time</MenuItem>
                  <MenuItem value="part-time">Part-time</MenuItem>
                  <MenuItem value="contractor">Contractor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleFormChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Payroll Settings Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight={600} sx={{ mt: 2 }}>
                Payroll Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wallet Address"
                value={formData.walletAddress}
                onChange={(e) => handleFormChange('walletAddress', e.target.value)}
                required
                error={Boolean(!formData.walletAddress || (formData.walletAddress.length > 0 && !isValidWalletAddress(formData.walletAddress)))}
                helperText={
                  !formData.walletAddress 
                    ? 'Wallet address is required' 
                    : formData.walletAddress.length > 0 && !isValidWalletAddress(formData.walletAddress)
                    ? 'Please enter a valid Ethereum wallet address (0x...)'
                    : 'Ethereum wallet address for receiving payments'
                }
                placeholder="0x..."
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary Amount"
                type="number"
                value={formData.salaryAmount}
                onChange={(e) => handleFormChange('salaryAmount', e.target.value)}
                required
                error={Boolean(!formData.salaryAmount || (formData.salaryAmount.length > 0 && (isNaN(parseFloat(formData.salaryAmount)) || parseFloat(formData.salaryAmount) <= 0)))}
                helperText={
                  !formData.salaryAmount 
                    ? 'Salary amount is required' 
                    : formData.salaryAmount.length > 0 && (isNaN(parseFloat(formData.salaryAmount)) || parseFloat(formData.salaryAmount) <= 0)
                    ? 'Please enter a valid amount greater than 0'
                    : ''
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Frequency</InputLabel>
                <Select
                  value={formData.paymentFrequency}
                  label="Payment Frequency"
                  onChange={(e) => handleFormChange('paymentFrequency', e.target.value)}
                >
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BIWEEKLY">Bi-weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="QUARTERLY">Quarterly</MenuItem>
                  <MenuItem value="ONE_TIME">One-time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Preferred Token</InputLabel>
                <Select
                  value={formData.preferredToken}
                  label="Preferred Token"
                  onChange={(e) => handleFormChange('preferredToken', e.target.value)}
                >
                  {Object.values(TOKEN_INFO).map((token) => (
                    <MenuItem key={token.symbol} value={token.symbol}>
                      {token.symbol} ({token.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* ENS Details Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight={600} sx={{ mt: 2 }}>
                ENS Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="ENS Subdomain"
                value={formData.subdomain}
                onChange={(e) => handleFormChange('subdomain', e.target.value)}
                helperText="If left empty, will be auto-generated from name"
                placeholder="john-doe"
                InputProps={{
                  endAdornment: <InputAdornment position="end">.company.eth</InputAdornment>,
                }}
              />
            </Grid>

            {/* Status Toggle */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                    color="primary"
                  />
                }
                label="Active Employee"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleAddEmployeeClose}
            color="inherit"
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddEmployee}
            variant="contained"
            disabled={submitting || !formData.name || !formData.email || !formData.walletAddress || 
                     !formData.position || !formData.department || !formData.salaryAmount}
            startIcon={submitting ? <CircularProgress size={20} /> : <AddIcon />}
            size="large"
            sx={{ ml: 2 }}
          >
            {submitting ? 'Adding Employee...' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeesNew
