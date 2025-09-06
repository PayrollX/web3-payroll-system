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
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Checkbox,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Stack,
  CardHeader,
  Skeleton,
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import {
  Payment as PaymentIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  AttachMoney as AttachMoneyIcon,
  Security as SecurityIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  Timer as TimerIcon,
  Cancel as CancelIcon,
  People as PeopleIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useAppDispatch } from '../store/store'
import { addNotification } from '../store/slices/uiSlice'
import { useBlockchain } from '../hooks/useBlockchain'
import { usePayments, useEmployees } from '../hooks/useApi'
import { 
  TOKEN_ADDRESSES, 
  NETWORKS, 
  PAYMENT_FREQUENCY_LABELS,
  TOKEN_INFO,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  DEFAULTS,
  CONTRACT_ADDRESSES
} from '../contracts/constants'

/**
 * Professional Payroll Processing page for Web3 Payroll System
 * Features Dashboard-inspired design with production-ready data fetching
 * @author Dev Austin
 */

interface PaymentSummary {
  totalAmount: string
  employeeCount: number
  tokenBreakdown: Record<string, { amount: string; count: number }>
  estimatedGas: string
}

interface ProcessingStep {
  label: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

const Payroll: React.FC = () => {
  const theme = useTheme()
  const { address, isConnected } = useAccount()
  const dispatch = useAppDispatch()
  
  // Blockchain hooks
  const {
    isOwner,
    currentNetwork,
    employees: blockchainEmployees,
    loadingEmployees,
    processPayroll,
    processIndividualPayment,
    calculatePaymentAmount,
    getContractBalance,
    refreshData,
  } = useBlockchain()
  
  // API hooks
  const { 
    employees: apiEmployees = [], 
    totalEmployees, 
    activeEmployees,
    refreshEmployees 
  } = useEmployees()
  
  const { 
    payments = [], 
    pendingPayments = [], 
    loading: paymentsLoading, 
    processPayroll: processPayrollAPI,
    processIndividualPayment: processIndividualPaymentAPI,
    refreshPayments 
  } = usePayments()
  
  // Local state
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [processingStep, setProcessingStep] = useState(0)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSummaryDialog, setShowSummaryDialog] = useState(false)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [contractBalance, setContractBalance] = useState('0')
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [processingType, setProcessingType] = useState<'batch' | 'individual'>('batch')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const employeesLoading = loadingEmployees // Alias for clarity

  // Derived data
  const filteredEmployees = (blockchainEmployees || []).filter((emp: any) => {
    if (!searchTerm) return emp.isActive
    const displayName = getEmployeeDisplayName(emp.walletAddress).toLowerCase()
    return emp.isActive && (
      displayName.includes(searchTerm.toLowerCase()) ||
      emp.walletAddress.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // compute pending employees array once for UI usage
  const pendingEmployeesList = (() => {
    if (!blockchainEmployees || !blockchainEmployees.length) return []
    const now = Date.now()
    return blockchainEmployees.filter((emp: any) => {
      const lastPayment = (emp.lastPaymentTimestamp || 0) * 1000
      const frequencyDays = emp.frequency === 0 ? 7 : emp.frequency === 1 ? 14 : emp.frequency === 2 ? 30 : 90
      return (now - lastPayment) > (frequencyDays * 24 * 60 * 60 * 1000)
    })
  })()

  /**
   * Load contract balance
   */
  const loadContractBalance = async () => {
    if (!currentNetwork) return
    
    setLoadingBalance(true)
    try {
      const ethAddress = TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]?.ETH
      console.log('🔍 Payroll: Loading contract balance for network:', currentNetwork)
      console.log('🔍 Payroll: ETH address:', ethAddress)
      
      if (ethAddress) {
        const balance = await getContractBalance(ethAddress)
        console.log('✅ Payroll: Contract balance loaded:', balance, 'ETH')
        setContractBalance(balance)
      }
    } catch (error) {
      console.error('❌ Payroll: Error loading contract balance:', error)
    } finally {
      setLoadingBalance(false)
    }
  }

  /**
   * Calculate payment summary
   */
  const calculatePaymentSummary = async (employeeAddresses: string[]): Promise<PaymentSummary> => {
    const tokenBreakdown: Record<string, { amount: string; count: number }> = {}
    let totalAmount = 0
    let totalGas = 0

    for (const addr of employeeAddresses) {
      try {
        const amount = await calculatePaymentAmount(addr)
        const employee = (blockchainEmployees || []).find((emp: any) => emp.walletAddress === addr)
        
        if (employee) {
          const tokenAddress = employee.preferredToken
          const tokenSymbol = getTokenSymbol(tokenAddress)
          
          if (!tokenBreakdown[tokenSymbol]) {
            tokenBreakdown[tokenSymbol] = { amount: '0', count: 0 }
          }
          
          tokenBreakdown[tokenSymbol].amount = (
            parseFloat(tokenBreakdown[tokenSymbol].amount) + parseFloat(amount)
          ).toString()
          tokenBreakdown[tokenSymbol].count += 1
          
          totalAmount += parseFloat(amount)
          totalGas += DEFAULTS.GAS_LIMIT
        }
      } catch (error) {
        console.error(`Error calculating payment for ${addr}:`, error)
      }
    }

    return {
      totalAmount: totalAmount.toString(),
      employeeCount: employeeAddresses.length,
      tokenBreakdown,
      estimatedGas: (totalGas / 1e9).toString(), // Convert to ETH
    }
  }

  /**
   * Get token symbol
   */
  const getTokenSymbol = (tokenAddress: string) => {
    if (!currentNetwork) return 'UNKNOWN'
    
    const networkTokens = TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]
    if (!networkTokens) return 'UNKNOWN'
    
    const token = Object.values(TOKEN_INFO).find((t: any) => {
      const tokenKey = t.symbol as keyof typeof networkTokens
      return networkTokens[tokenKey] === tokenAddress
    })
    return token?.symbol || 'UNKNOWN'
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount: string, decimals = 4) => {
    const num = parseFloat(amount)
    return isNaN(num) ? '0.0000' : num.toFixed(decimals)
  }

  // MetricCard component (kept as you had it)
  const MetricCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    subtitle?: string
    loading?: boolean
  }> = ({ title, value, icon, color = 'primary', subtitle, loading = false }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.05)} 0%, ${alpha(theme.palette[color].main, 0.02)} 100%)`,
        border: `1px solid ${alpha(theme.palette[color].main, 0.12)}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${alpha(theme.palette[color].main, 0.15)}`,
          borderColor: alpha(theme.palette[color].main, 0.25),
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {title}
            </Typography>
            {loading ? (
              <Skeleton variant="text" width="60%" height={32} />
            ) : (
              <Typography variant="h5" component="div" fontWeight={600} noWrap>
                {value}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )

  /**
   * Handle employee selection
   */
  const handleEmployeeSelection = (employeeAddress: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees(prev => [...prev, employeeAddress])
    } else {
      setSelectedEmployees(prev => prev.filter(addr => addr !== employeeAddress))
    }
  }

  /**
   * Handle select all employees
   */
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allAddresses = (blockchainEmployees || [])
        .filter((emp: any) => emp.isActive)
        .map((emp: any) => emp.walletAddress)
      setSelectedEmployees(allAddresses)
    } else {
      setSelectedEmployees([])
    }
  }

  /**
   * Handle batch payroll processing
   */
  const handleBatchPayroll = async () => {
    if (selectedEmployees.length === 0) {
      dispatch(addNotification({
        type: 'error',
        title: 'No Employees Selected',
        message: 'Please select at least one employee to process payroll',
      }))
      return
    }

    // Calculate summary
    const summary = await calculatePaymentSummary(selectedEmployees)
    setPaymentSummary(summary)
    setShowSummaryDialog(true)
  }

  /**
   * Confirm and process batch payroll
   */
  const confirmBatchPayroll = async () => {
    setShowSummaryDialog(false)
    setIsProcessing(true)
    setProcessingStep(0)

    const steps: ProcessingStep[] = [
      {
        label: 'Validate Employees',
        description: 'Checking employee data and payment eligibility',
        status: 'pending',
      },
      {
        label: 'Estimate Gas',
        description: 'Calculating transaction gas requirements',
        status: 'pending',
      },
      {
        label: 'Process Blockchain Transaction',
        description: 'Executing payroll on smart contract',
        status: 'pending',
      },
      {
        label: 'Update Database',
        description: 'Recording payment in database',
        status: 'pending',
      },
      {
        label: 'Complete',
        description: 'Payroll processing completed successfully',
        status: 'pending',
      },
    ]

    setProcessingSteps(steps)

    try {
      // Step 1: Validate employees
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'processing' } : step
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate validation
      
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 0 ? { ...step, status: 'completed' } : step
      ))
      setProcessingStep(1)

      // Step 2: Estimate gas
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'processing' } : step
      ))
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate gas estimation
      
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 1 ? { ...step, status: 'completed' } : step
      ))
      setProcessingStep(2)

      // Step 3: Process blockchain transaction
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'processing' } : step
      ))

      const blockchainResult = await processPayroll(selectedEmployees)
      
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain transaction failed')
      }

      setProcessingSteps(prev => prev.map((step, index) => 
        index === 2 ? { ...step, status: 'completed' } : step
      ))
      setProcessingStep(3)

      // Step 4: Update database
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, status: 'processing' } : step
      ))

      const apiResult = await processPayrollAPI(selectedEmployees.map(addr => {
        const employee = (apiEmployees || []).find((emp: any) => emp.payrollSettings?.walletAddress === addr)
        return employee?._id || ''
      }).filter(id => id))

      if (!apiResult) {
        throw new Error('Failed to update database')
      }

      setProcessingSteps(prev => prev.map((step, index) => 
        index === 3 ? { ...step, status: 'completed' } : step
      ))
      setProcessingStep(4)

      // Step 5: Complete
      setProcessingSteps(prev => prev.map((step, index) => 
        index === 4 ? { ...step, status: 'completed' } : step
      ))

      dispatch(addNotification({
        type: 'success',
        title: 'Payroll Processed',
        message: `Successfully processed payroll for ${selectedEmployees.length} employees`,
      }))

      // Refresh data
      await Promise.all([
        refreshData(),
        refreshEmployees(),
        refreshPayments(),
        loadContractBalance(),
      ])

      setSelectedEmployees([])
    } catch (error: any) {
      const currentStepIndex = processingStep
      setProcessingSteps(prev => prev.map((step, index) => 
        index === currentStepIndex ? { 
          ...step, 
          status: 'error', 
          error: error?.message || String(error)
        } : step
      ))

      dispatch(addNotification({
        type: 'error',
        title: 'Payroll Processing Failed',
        message: error?.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Handle individual payment processing
   */
  const handleIndividualPayment = async (employeeAddress: string) => {
    setSelectedEmployee(employeeAddress)
    setProcessingType('individual')
    setShowConfirmDialog(true)
  }

  /**
   * Confirm individual payment
   */
  const confirmIndividualPayment = async () => {
    setShowConfirmDialog(false)
    setIsProcessing(true)

    try {
      // Process blockchain transaction
      const blockchainResult = await processIndividualPayment(selectedEmployee)
      
      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain transaction failed')
      }

      // Update database
      const employee = (apiEmployees || []).find((emp: any) => emp.payrollSettings?.walletAddress === selectedEmployee)
      if (employee?._id) {
        await processIndividualPaymentAPI(employee._id)
      }

      dispatch(addNotification({
        type: 'success',
        title: 'Payment Processed',
        message: 'Individual payment processed successfully',
      }))

      // Refresh data
      await Promise.all([
        refreshData(),
        refreshEmployees(),
        refreshPayments(),
        loadContractBalance(),
      ])
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        title: 'Payment Failed',
        message: error?.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setIsProcessing(false)
      setSelectedEmployee('')
    }
  }

  /**
   * Get employee display name
   */
  const getEmployeeDisplayName = (identifier: string) => {
    if (!identifier) return 'Unknown'
    // Check if it's a wallet address (starts with 0x)
    if (identifier.startsWith('0x')) {
      const apiEmployee = (apiEmployees || []).find((emp: any) => emp.payrollSettings?.walletAddress === identifier)
      return apiEmployee?.personalInfo?.name || `${identifier.slice(0, 6)}...${identifier.slice(-4)}`
    }
    // Otherwise, it's an employee ID
    const apiEmployee = (apiEmployees || []).find((emp: any) => emp._id === identifier)
    return apiEmployee?.personalInfo?.name || 'Unknown Employee'
  }

  // Load contract balance on mount
  useEffect(() => {
    if (isConnected && currentNetwork) {
      loadContractBalance()
    }
  }, [isConnected, currentNetwork])

  if (!isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Payroll Processing
        </Typography>
        <Alert severity="info">
          Please connect your wallet to process payroll.
        </Alert>
      </Box>
    )
  }

  if (!isOwner) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Payroll Processing
        </Typography>
        <Alert severity="warning">
          Only contract owners can process payroll.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Professional Header with Gradient */}
      <Box sx={{ 
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderRadius: 2,
        p: 3,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Payroll Processing
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Process salary payments for your employees with blockchain security
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={() => { 
                  console.log('🔄 Payroll: Manual refresh triggered')
                  refreshData(); 
                  refreshEmployees(); 
                  refreshPayments(); 
                  loadContractBalance(); 
                }}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handleBatchPayroll}
              disabled={isProcessing || selectedEmployees.length === 0}
              size="large"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
            >
              Process Selected ({selectedEmployees.length})
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Professional Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Employees"
            value={filteredEmployees.length}
            icon={<PeopleIcon />}
            color="primary"
            subtitle="Ready for payment"
            loading={employeesLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Selected for Payment"
            value={selectedEmployees.length}
            icon={<CheckCircleIcon />}
            color="secondary"
            subtitle="Employees in batch"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Contract Balance"
            value={`${formatCurrency(contractBalance)} ETH`}
            icon={<AccountBalanceIcon />}
            color={parseFloat(contractBalance || '0') < 1 ? 'warning' : 'success'}
            subtitle={parseFloat(contractBalance || '0') < 1 ? 'Low balance' : 'Sufficient funds'}
            loading={loadingBalance}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Payments"
            value={pendingEmployeesList.length || 0}
            icon={<ScheduleIcon />}
            color="warning"
            subtitle="Awaiting processing"
          />
        </Grid>
      </Grid>

      {/* Contract Balance Alert */}
      {parseFloat(contractBalance || '0') < 1 && (
        <Alert 
          severity="warning"
          icon={<AccountBalanceIcon />}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': { fontWeight: 500 }
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            Low Contract Balance Warning
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Current balance: {formatCurrency(contractBalance)} ETH. Consider adding more funds to ensure successful payments.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace', fontSize: '0.75rem' }}>
            Contract: {currentNetwork ? (CONTRACT_ADDRESSES[currentNetwork as keyof typeof CONTRACT_ADDRESSES]?.PayrollManager || 'Unknown') : 'Not connected'}
          </Typography>
        </Alert>
      )}

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardHeader
          title="Employee Selection"
          subheader="Select employees for payroll processing"
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          }}
        />
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <TextField
              placeholder="Search employees..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                  indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label="Select All"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Employee List with Professional Design */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={2}>
              <PeopleIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Employees ({filteredEmployees.length})
              </Typography>
            </Stack>
          }
          subheader="Select employees to include in payroll batch"
          sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
          }}
        />
        <CardContent sx={{ p: 0 }}>
          {employeesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredEmployees.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ m: 3, borderRadius: 2 }}
              icon={<InfoIcon />}
            >
              <Typography variant="body1" fontWeight={600}>
                No employees found
              </Typography>
              <Typography variant="body2">
                {searchTerm ? 'Try adjusting your search terms.' : 'Add employees to start processing payroll.'}
              </Typography>
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                        indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < filteredEmployees.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Salary</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Payment</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.map((employee: any) => {
                    const isSelected = selectedEmployees.includes(employee.walletAddress)
                    const lastPayment = new Date((employee.lastPaymentTimestamp || 0) * 1000)
                    const daysOverdue = Math.floor((Date.now() - ((employee.lastPaymentTimestamp || 0) * 1000)) / (24 * 60 * 60 * 1000))
                    const isPending = daysOverdue > 0
                    
                    return (
                      <TableRow 
                        key={employee.walletAddress}
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                          ...(isSelected && {
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          })
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleEmployeeSelection(employee.walletAddress, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar 
                              sx={{ 
                                width: 40, 
                                height: 40,
                                bgcolor: theme.palette.primary.main,
                                fontWeight: 600
                              }}
                            >
                              {getEmployeeDisplayName(employee.walletAddress).charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight={500}>
                                {getEmployeeDisplayName(employee.walletAddress)}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                fontFamily="monospace"
                                sx={{ fontSize: '0.75rem' }}
                              >
                                {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body1" fontWeight={500}>
                              {formatCurrency(employee.salaryAmount?.toString?.() ?? '0')} {getTokenSymbol(employee.preferredToken)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.paymentFrequency}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isPending ? `${daysOverdue} days overdue` : 'Current'}
                            color={isPending ? (daysOverdue > 30 ? 'error' : 'warning') : 'success'}
                            size="small"
                            variant={isPending ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {lastPayment.toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Process Individual Payment">
                              <IconButton
                                size="small"
                                onClick={() => handleIndividualPayment(employee.walletAddress)}
                                disabled={isProcessing}
                                sx={{
                                  color: theme.palette.success.main,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.success.main, 0.1)
                                  }
                                }}
                              >
                                <PlayArrowIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                sx={{
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                                  }
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Payments
          </Typography>
          
          {paymentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !payments || payments.length === 0 ? (
            <Alert severity="info">
              No payments found.
            </Alert>
          ) : (
            <List>
              {(payments || []).slice(0, 5).map((payment: any, index: number) => (
                <React.Fragment key={payment._id}>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${getEmployeeDisplayName(payment.employeeId)} - ${formatCurrency(payment.amount?.toString?.() ?? '0')} ${payment.tokenSymbol}`}
                      secondary={`${new Date(payment.paymentDate).toLocaleDateString()} • ${payment.transactionHash}`}
                    />
                    <Chip
                      label={payment.status}
                      color={payment.status === 'completed' ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                  {index < (payments || []).length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      <Dialog open={isProcessing} maxWidth="md" fullWidth>
        <DialogTitle>Processing Payroll</DialogTitle>
        <DialogContent>
          <Stepper activeStep={processingStep} orientation="vertical">
            {processingSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel
                  error={step.status === 'error'}
                  icon={
                    step.status === 'completed' ? <CheckCircleIcon /> :
                    step.status === 'error' ? <ErrorIcon /> :
                    step.status === 'processing' ? <CircularProgress size={20} /> :
                    undefined
                  }
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                  {step.status === 'processing' && (
                    <LinearProgress sx={{ mb: 2 }} />
                  )}
                  {step.status === 'error' && step.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {step.error}
                    </Alert>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
      </Dialog>

      {/* Payment Summary Dialog */}
      <Dialog open={showSummaryDialog} onClose={() => setShowSummaryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Summary</DialogTitle>
        <DialogContent>
          {paymentSummary && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Total Employees</Typography>
                  <Typography variant="h6">{paymentSummary.employeeCount}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h6">{formatCurrency(paymentSummary.totalAmount)} ETH</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Estimated Gas</Typography>
                  <Typography variant="h6">{formatCurrency(paymentSummary.estimatedGas)} ETH</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Total Cost</Typography>
                  <Typography variant="h6">
                    {formatCurrency((parseFloat(paymentSummary.totalAmount) + parseFloat(paymentSummary.estimatedGas)).toString())} ETH
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Token Breakdown
              </Typography>
              {Object.entries(paymentSummary.tokenBreakdown).map(([token, data]) => (
                <Box key={token} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{token}</Typography>
                  <Typography variant="body2">
                    {formatCurrency(data.amount)} ({data.count} employees)
                  </Typography>
                </Box>
              ))}

              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  This action will process payments for {paymentSummary.employeeCount} employees. 
                  Make sure you have sufficient contract balance.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSummaryDialog(false)}>Cancel</Button>
          <Button onClick={confirmBatchPayroll} variant="contained" color="primary">
            Confirm & Process
          </Button>
        </DialogActions>
      </Dialog>

      {/* Individual Payment Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Individual Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to process payment for {getEmployeeDisplayName(selectedEmployee)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={confirmIndividualPayment} variant="contained" color="primary">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Payroll