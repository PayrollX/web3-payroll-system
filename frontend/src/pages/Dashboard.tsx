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
  Paper,
  Avatar,
  CardHeader,
  CardActions,
  Fade,
  Skeleton,
  useTheme,
  alpha,
  Stack,
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
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Launch as LaunchIcon,
  Timeline as TimelineIcon,
  Widgets as WidgetsIcon,
  Dns as ENSIcon,
} from '@mui/icons-material'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../store/store'
import { addNotification } from '../store/slices/uiSlice'
import { useBlockchain } from '../hooks/useBlockchain'
import { useAnalytics } from '../hooks/useApi'
import { useContractBalance } from '../hooks/useBlockchain'
import { useDashboardMetrics } from '../services/dashboardService'
import { SUCCESS_MESSAGES, ERROR_MESSAGES, NETWORKS } from '../contracts/constants'

/**
 * Professional Dashboard page for Web3 Payroll System
 * @author Dev Austin
 */

const Dashboard: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const dispatch = useAppDispatch()
  
  // Enhanced dashboard metrics hook
  const {
    totalEmployees,
    activeEmployees,
    contractBalance,
    monthlyPayroll,
    pendingPayments,
    loading: dashboardLoading,
    error: dashboardError,
    lastUpdated,
    refresh: refreshDashboard
  } = useDashboardMetrics()
  
  // Blockchain hooks (for contract info and ownership)
  const {
    isOwner,
    currentNetwork,
    contractInfo,
    isPaused,
    refreshData,
  } = useBlockchain()
  
  // API hooks (for additional analytics)
  const { analytics, loading: analyticsLoading, refreshAnalytics } = useAnalytics()
  
  // Local state
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy')
  
  // Compute system status based on various factors
  useEffect(() => {
    if (isPaused) {
      setSystemStatus('error')
    } else if (parseFloat(contractBalance) < 0.1) {
      setSystemStatus('warning')
    } else {
      setSystemStatus('healthy')
    }
  }, [isPaused, contractBalance])

  /**
   * Handle refresh all data
   */
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refreshDashboard(), // Use new dashboard refresh
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
    const network = Object.values(NETWORKS).find((n: any) => n.chainId === currentNetwork)
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
   * Get pending payments count (now using API data)
   */
  const getPendingPaymentsCount = () => {
    return pendingPayments
  }

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      refreshDashboard() // Use new dashboard refresh
      refreshData()
      refreshAnalytics()
    }, 30000)

    return () => clearInterval(interval)
  }, [isConnected, refreshDashboard, refreshData, refreshAnalytics])

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
          <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Connect Your Wallet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please connect your wallet to access the PayrollX dashboard and manage your payroll system.
        </Typography>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Make sure you're connected to the correct network for your payroll contract.
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
    trend = null, 
    loading = false,
    action = null 
  }: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    trend?: { value: number; direction: 'up' | 'down' } | null
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
              {trend && (
                <Chip
                  icon={trend.direction === 'up' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                  label={`${trend.value > 0 ? '+' : ''}${trend.value}%`}
                  size="small"
                  color={trend.direction === 'up' ? 'success' : 'error'}
                  sx={{ height: 20, fontSize: '0.75rem' }}
                />
              )}
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
      {(refreshing || dashboardLoading || analyticsLoading) && (
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
            Welcome back! 👋
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
            Here's what's happening with your payroll system
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<CheckCircleIcon />}
              label={getNetworkName()}
              color="primary"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Contract: {contractInfo?.address ? `${contractInfo.address.slice(0, 6)}...${contractInfo.address.slice(-4)}` : 'Not deployed'}
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
        {dashboardError && (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />} 
            sx={{ borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            Dashboard Error: {dashboardError}
          </Alert>
        )}

      {isPaused && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 2 }}>
          Contract is currently paused. Some operations may be restricted.
        </Alert>
      )}

      {!isOwner && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
          You are viewing the dashboard as a non-owner. Some administrative functions are not available.
        </Alert>
      )}
      </Stack>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Total Employees"
            value={totalEmployees}
            subtitle={`${activeEmployees} active employees`}
            icon={<PeopleIcon />}
            color="primary"
            loading={dashboardLoading}
            action={
              <IconButton size="small" onClick={() => navigate('/employees')}>
                <LaunchIcon fontSize="small" />
              </IconButton>
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Contract Balance"
            value={`${formatCurrency(contractBalance)} ETH`}
            subtitle="Available for payroll"
            icon={<AccountBalanceIcon />}
            color="secondary"
            loading={dashboardLoading}
            trend={{ value: 12.5, direction: 'up' }}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Monthly Payroll"
            value={`${formatCurrency(monthlyPayroll)} ETH`}
            subtitle="This month's total"
            icon={<TrendingUpIcon />}
            color="success"
            loading={dashboardLoading}
            trend={{ value: 8.2, direction: 'up' }}
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard
            title="Pending Payments"
            value={getPendingPaymentsCount()}
            subtitle="Overdue payments"
            icon={<ScheduleIcon />}
            color={getPendingPaymentsCount() > 0 ? 'warning' : 'success'}
            loading={dashboardLoading}
            action={
              getPendingPaymentsCount() > 0 && (
                <IconButton size="small" onClick={() => navigate('/payroll')}>
                  <LaunchIcon fontSize="small" />
                </IconButton>
              )
            }
          />
        </Grid>
      </Grid>

      {/* Quick Actions Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <WidgetsIcon />
                </Avatar>
              }
              title="Quick Actions"
              subheader="Manage your payroll operations"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<PaymentIcon />}
                    disabled={!isOwner || isPaused || totalEmployees === 0}
                    onClick={() => navigate('/payroll')}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Process Payroll
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    fullWidth
                    startIcon={<AddIcon />}
                    disabled={!isOwner}
                    onClick={() => navigate('/employees')}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Add Employee
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    color="info"
                    fullWidth
                    startIcon={<TimelineIcon />}
                    onClick={() => navigate('/analytics')}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    View Analytics
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    color="warning"
                    fullWidth
                    startIcon={<ENSIcon />}
                    onClick={() => navigate('/ens')}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    ENS Management
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics and Activity */}
      <Grid container spacing={3}>
      {/* Analytics Overview */}
      {analytics && (
          <>
          <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <TimelineIcon />
                    </Avatar>
                  }
                  title="Department Breakdown"
                  subheader="Employee distribution by department"
                />
              <CardContent>
                  <List sx={{ py: 0 }}>
                  {analytics.departmentBreakdown.map((dept, index) => (
                    <React.Fragment key={dept.department}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              fontSize: '0.875rem'
                            }}>
                              {dept.employeeCount}
                            </Avatar>
                          </ListItemIcon>
                        <ListItemText
                          primary={dept.department}
                          secondary={`${dept.employeeCount} employees`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                        />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          {formatCurrency(dept.totalSalary)} ETH
                        </Typography>
                            <Typography variant="caption" color="text.secondary">
                              monthly cost
                            </Typography>
                          </Box>
                      </ListItem>
                      {index < analytics.departmentBreakdown.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', borderRadius: 3 }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <PaymentIcon />
                    </Avatar>
                  }
                  title="Token Usage"
                  subheader="Payment token distribution"
                />
              <CardContent>
                  <List sx={{ py: 0 }}>
                  {analytics.tokenUsage.map((token, index) => (
                    <React.Fragment key={token.token}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar sx={{ 
                              width: 32, 
                              height: 32, 
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: 'success.main',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              {token.symbol}
                            </Avatar>
                          </ListItemIcon>
                        <ListItemText
                          primary={token.symbol}
                          secondary={`${token.percentage.toFixed(1)}% of total`}
                            primaryTypographyProps={{ fontWeight: 600 }}
                        />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                          {formatCurrency(token.amount)} {token.symbol}
                        </Typography>
                            <Typography variant="caption" color="text.secondary">
                              total volume
                            </Typography>
                          </Box>
                      </ListItem>
                      {index < analytics.tokenUsage.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          </>
        )}

        {/* Recent Activity / Employee Overview */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <PeopleIcon />
                </Avatar>
              }
              title="Employee Overview"
              subheader={`Managing ${totalEmployees} employees across your organization`}
              action={
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/employees')}
                  disabled={!isOwner}
                  sx={{ borderRadius: 2 }}
                >
                  Add Employee
                </Button>
              }
            />
            <CardContent>
              {dashboardLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : totalEmployees === 0 ? (
                <Paper sx={{ 
                  p: 4, 
                  textAlign: 'center', 
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`,
                  borderRadius: 2
                }}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    No employees yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Add your first employee to get started with payroll management.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/employees')}
                    disabled={!isOwner}
                    sx={{ borderRadius: 2 }}
                  >
                    Add First Employee
                </Button>
                </Paper>
              ) : (
                <Alert 
                  severity="success" 
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Employee system is active with {totalEmployees} total employees ({activeEmployees} active).
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard