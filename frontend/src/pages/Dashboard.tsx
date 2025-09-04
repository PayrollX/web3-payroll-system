import React, { useEffect, useState } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useAppDispatch } from '../store/store'
import { addNotification } from '../store/slices/uiSlice'
import { useBlockchain } from '../hooks/useBlockchain'
import { useAnalytics } from '../hooks/useApi'
import { useContractBalance } from '../hooks/useBlockchain'
import { TOKEN_ADDRESSES, NETWORKS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../contracts/constants'

/**
 * Professional Dashboard page for Web3 Payroll System
 * @author Dev Austin
 */

const Dashboard: React.FC = () => {
  const { address, isConnected } = useAccount()
  const dispatch = useAppDispatch()
  
  // Blockchain hooks
  const {
    isOwner,
    currentNetwork,
    contractInfo,
    employees,
    activeEmployees,
    loadingEmployees,
    isPaused,
    refreshData,
  } = useBlockchain()
  
  // API hooks
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useAnalytics()
  
  // Contract balance hooks
  const { balance: ethBalance, loading: balanceLoading } = useContractBalance(
    TOKEN_ADDRESSES[currentNetwork as keyof typeof TOKEN_ADDRESSES]?.ETH || '0x0000000000000000000000000000000000000000'
  )
  
  // Local state
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')
  
  // Compute system status based on various factors
  useEffect(() => {
    if (isPaused) {
      setSystemStatus('error')
    } else if (parseFloat(ethBalance) < 0.1) {
      setSystemStatus('warning')
    } else {
      setSystemStatus('healthy')
    }
  }, [isPaused, ethBalance])

  /**
   * Handle refresh all data
   */
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refreshData(),
        refreshAnalytics(),
      ])
      setLastRefresh(new Date())
      dispatch(addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: SUCCESS_MESSAGES.TRANSACTION_CONFIRMED,
      }))
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: ERROR_MESSAGES.NETWORK_ERROR,
      }))
    } finally {
      setRefreshing(false)
    }
  }

  /**
   * Get network name
   */
  const getNetworkName = () => {
    if (!currentNetwork) return 'Unknown'
    const network = Object.values(NETWORKS).find(n => n.chainId === currentNetwork)
    return network?.name || 'Unknown'
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount: string, decimals = 4) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0.0000'
    return num.toFixed(decimals)
  }

  /**
   * Get pending payments count
   */
  const getPendingPaymentsCount = () => {
    if (!employees.length) return 0
    const now = Date.now()
    return employees.filter(emp => {
      const lastPayment = emp.lastPaymentTimestamp * 1000
      const frequencyDays = emp.frequency === 0 ? 7 : emp.frequency === 1 ? 14 : emp.frequency === 2 ? 30 : 90
      return (now - lastPayment) > (frequencyDays * 24 * 60 * 60 * 1000)
    }).length
  }

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      refreshData()
      refreshAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected, refreshData, refreshAnalytics])

  if (!isConnected) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Web3 Payroll Dashboard
        </Typography>
        <Alert severity="info" icon={<InfoIcon />}>
          Please connect your wallet to view the dashboard and manage your payroll system.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Loading Progress Bar */}
      {(refreshing || loadingEmployees || analyticsLoading || balanceLoading) && (
        <LinearProgress sx={{ mb: 2 }} />
      )}
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          {/* System Status Indicator */}
          <Chip 
            icon={
              systemStatus === 'healthy' ? <CheckCircleIcon /> :
              systemStatus === 'warning' ? <PendingIcon /> :
              <ErrorIcon />
            }
            label={
              systemStatus === 'healthy' ? 'System Healthy' :
              systemStatus === 'warning' ? 'Warning' :
              'System Error'
            }
            color={
              systemStatus === 'healthy' ? 'success' :
              systemStatus === 'warning' ? 'warning' :
              'error'
            }
            size="small"
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* System Status Alerts */}
      {isPaused && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          Contract is currently paused. Some operations may be restricted.
        </Alert>
      )}

      {!isOwner && (
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          You are viewing the dashboard as a non-owner. Some administrative functions are not available.
        </Alert>
      )}

      {/* Network Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Network Status</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body1" color="primary">
                {getNetworkName()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contract: {contractInfo?.address ? `${contractInfo.address.slice(0, 6)}...${contractInfo.address.slice(-4)}` : 'Not deployed'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Employees</Typography>
              </Box>
              {loadingEmployees ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h4" color="primary">
                    {employees.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeEmployees.length} active
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Contract Balance</Typography>
              </Box>
              {balanceLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h4" color="secondary">
                    {formatCurrency(ethBalance)} ETH
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available for payroll
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Monthly Payroll</Typography>
              </Box>
              {analyticsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography variant="h4" color="success.main">
                    {analytics ? formatCurrency(analytics.monthlyPayrollAmount) : '0.0000'} ETH
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This month
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Payments</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {getPendingPaymentsCount()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Overview */}
      {analytics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Breakdown
                </Typography>
                <List>
                  {analytics.departmentBreakdown.map((dept, index) => (
                    <React.Fragment key={dept.department}>
                      <ListItem>
                        <ListItemText
                          primary={dept.department}
                          secondary={`${dept.employeeCount} employees`}
                        />
                        <Typography variant="body2" color="primary">
                          {formatCurrency(dept.totalSalary)} ETH
                        </Typography>
                      </ListItem>
                      {index < analytics.departmentBreakdown.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Token Usage
                </Typography>
                <List>
                  {analytics.tokenUsage.map((token, index) => (
                    <React.Fragment key={token.token}>
                      <ListItem>
                        <ListItemText
                          primary={token.symbol}
                          secondary={`${token.percentage.toFixed(1)}% of total`}
                        />
                        <Typography variant="body2" color="primary">
                          {formatCurrency(token.amount)} {token.symbol}
                        </Typography>
                      </ListItem>
                      {index < analytics.tokenUsage.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Employees
              </Typography>
              {loadingEmployees ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : employees.length === 0 ? (
                <Alert severity="info">
                  No employees found. Add your first employee to get started.
                </Alert>
              ) : (
                <List>
                  {employees.slice(0, 5).map((employee, index) => (
                    <React.Fragment key={employee.walletAddress}>
                      <ListItem>
                        <ListItemIcon>
                          <AccountBalanceIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${employee.position} - ${employee.department}`}
                          secondary={`${employee.ensSubdomain}.company.eth • ${formatCurrency(employee.salaryAmount)} ETH`}
                        />
                        <Chip
                          label={employee.isActive ? 'Active' : 'Inactive'}
                          color={employee.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </ListItem>
                      {index < employees.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!isOwner || isPaused || employees.length === 0}
                >
                  Process Payroll
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  fullWidth
                  disabled={!isOwner}
                >
                  Add Employee
                </Button>
                <Button variant="outlined" color="info" fullWidth>
                  View Analytics
                </Button>
                <Button variant="outlined" color="warning" fullWidth>
                  ENS Management
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard