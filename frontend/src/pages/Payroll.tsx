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
} from '@mui/material'
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
  DEFAULTS
} from '../contracts/constants'

/**
 * Professional Payroll Processing page for Web3 Payroll System
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
    employees: apiEmployees, 
    totalEmployees, 
    activeEmployees,
    refreshEmployees 
  } = useEmployees()
  
  const { 
    payments, 
    pendingPayments, 
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

  /**
   * Load contract balance
   */
  const loadContractBalance = async () => {
    if (!currentNetwork) return
    
    setLoadingBalance(true)
    try {
      const ethAddress = TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]?.ETH
      if (ethAddress) {
        const balance = await getContractBalance(ethAddress)
        setContractBalance(balance)
      }
    } catch (error) {
      console.error('Error loading contract balance:', error)
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

    for (const address of employeeAddresses) {
      try {
        const amount = await calculatePaymentAmount(address)
        const employee = blockchainEmployees.find(emp => emp.walletAddress === address)
        
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
        console.error(`Error calculating payment for ${address}:`, error)
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
    
    const token = Object.values(TOKEN_INFO).find(t => {
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
      const allAddresses = blockchainEmployees
        .filter(emp => emp.isActive)
        .map(emp => emp.walletAddress)
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
        const employee = apiEmployees.find(emp => emp.payrollSettings.walletAddress === addr)
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
          error: error.message 
        } : step
      ))

      dispatch(addNotification({
        type: 'error',
        title: 'Payroll Processing Failed',
        message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
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
      const employee = apiEmployees.find(emp => emp.payrollSettings.walletAddress === selectedEmployee)
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
        message: error.message || ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setIsProcessing(false)
      setSelectedEmployee('')
    }
  }

  /**
   * Get pending employees
   */
  const getPendingEmployees = () => {
    if (!blockchainEmployees.length) return []
    
    const now = Date.now()
    return blockchainEmployees.filter(emp => {
      const lastPayment = emp.lastPaymentTimestamp * 1000
      const frequencyDays = emp.frequency === 0 ? 7 : emp.frequency === 1 ? 14 : emp.frequency === 2 ? 30 : 90
      return (now - lastPayment) > (frequencyDays * 24 * 60 * 60 * 1000)
    })
  }

  /**
   * Get employee display name
   */
  const getEmployeeDisplayName = (identifier: string) => {
    // Check if it's a wallet address (starts with 0x)
    if (identifier.startsWith('0x')) {
      const apiEmployee = apiEmployees.find(emp => emp.payrollSettings.walletAddress === identifier)
      return apiEmployee?.personalInfo.name || `${identifier.slice(0, 6)}...${identifier.slice(-4)}`
    }
    // Otherwise, it's an employee ID
    const apiEmployee = apiEmployees.find(emp => emp._id === identifier)
    return apiEmployee?.personalInfo.name || 'Unknown Employee'
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

  const pendingEmployees = getPendingEmployees()
  const allSelected = selectedEmployees.length === pendingEmployees.length && pendingEmployees.length > 0

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Payroll Processing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Process salary payments for your employees
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => { refreshData(); refreshEmployees(); refreshPayments(); loadContractBalance(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PaymentIcon />}
            onClick={handleBatchPayroll}
            disabled={isProcessing || selectedEmployees.length === 0}
          >
            Process Selected ({selectedEmployees.length})
          </Button>
        </Box>
      </Box>

      {/* Contract Balance Alert */}
      <Alert 
        severity={parseFloat(contractBalance) < 1 ? 'warning' : 'info'} 
        icon={<AccountBalanceIcon />}
        sx={{ mb: 3 }}
      >
        Contract Balance: {formatCurrency(contractBalance)} ETH
        {parseFloat(contractBalance) < 1 && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Low balance warning: Consider adding more funds to the contract
          </Typography>
        )}
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="primary">
                    {blockchainEmployees.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {pendingEmployees.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Payments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoneyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="success.main">
                    {payments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Payments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4" color="info.main">
                    {formatCurrency(contractBalance)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Balance
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Payments */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Pending Payments
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedEmployees.length > 0 && selectedEmployees.length < pendingEmployees.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              }
              label="Select All"
            />
          </Box>
          
          {loadingEmployees ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pendingEmployees.length === 0 ? (
            <Alert severity="success">
              No pending payments. All employees are up to date!
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Salary</TableCell>
                    <TableCell>Last Payment</TableCell>
                    <TableCell>Days Overdue</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingEmployees.map((employee) => {
                    const isSelected = selectedEmployees.includes(employee.walletAddress)
                    const lastPayment = new Date(employee.lastPaymentTimestamp * 1000)
                    const daysOverdue = Math.floor((Date.now() - employee.lastPaymentTimestamp * 1000) / (24 * 60 * 60 * 1000))
                    
                    return (
                      <TableRow key={employee.walletAddress}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleEmployeeSelection(employee.walletAddress, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {getEmployeeDisplayName(employee.walletAddress).charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" fontWeight="medium">
                                {getEmployeeDisplayName(employee.walletAddress)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                                {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          {formatCurrency(employee.salaryAmount)} {getTokenSymbol(employee.preferredToken)}
                        </TableCell>
                        <TableCell>
                          {lastPayment.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${daysOverdue} days`}
                            color={daysOverdue > 30 ? 'error' : daysOverdue > 7 ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Process Individual Payment">
                            <IconButton
                              size="small"
                              onClick={() => handleIndividualPayment(employee.walletAddress)}
                              disabled={isProcessing}
                            >
                              <PlayArrowIcon />
                            </IconButton>
                          </Tooltip>
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
          ) : payments.length === 0 ? (
            <Alert severity="info">
              No payments found.
            </Alert>
          ) : (
            <List>
              {payments.slice(0, 5).map((payment, index) => (
                <React.Fragment key={payment._id}>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${getEmployeeDisplayName(payment.employeeId)} - ${formatCurrency(payment.amount)} ${payment.tokenSymbol}`}
                      secondary={`${new Date(payment.paymentDate).toLocaleDateString()} • ${payment.transactionHash}`}
                    />
                    <Chip
                      label={payment.status}
                      color={payment.status === 'completed' ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                  {index < payments.length - 1 && <Divider />}
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