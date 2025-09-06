/**
 * Enhanced Analytics Page with Advanced Dashboard
 * Provides comprehensive analytics with both basic and advanced views
 * @author Dev Austin
 */

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  AccountBalanceWallet,
  Refresh,
  Download,
  FilterList,
  Timeline,
  PieChart,
  BarChart,
  Assessment,
  Analytics as AnalyticsIcon,
  Speed,
  Insights
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { useAnalytics } from '../hooks/useApi'
import { apiService } from '../services/apiService'
import AdvancedAnalyticsDashboard from '../components/Analytics/AdvancedAnalyticsDashboard'

// Color palette for consistent theming
const COLORS = {
  primary: '#1976d2',
  secondary: '#dc004e',
  success: '#2e7d32',
  warning: '#ed6c02',
  info: '#0288d1',
  error: '#d32f2f',
  chart: ['#1976d2', '#dc004e', '#2e7d32', '#ed6c02', '#0288d1', '#9c27b0', '#ff9800', '#4caf50']
}

// Custom tooltip component for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2, boxShadow: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        {payload.map((entry: any, index: number) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Paper>
    )
  }
  return null
}

// Metric card component
const MetricCard: React.FC<{
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color?: string
  subtitle?: string
}> = ({ title, value, change, icon, color = COLORS.primary, subtitle }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
        {change !== undefined && (
          <Chip
            icon={change >= 0 ? <TrendingUp /> : <TrendingDown />}
            label={`${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
            color={change >= 0 ? 'success' : 'error'}
            size="small"
            variant="outlined"
          />
        )}
      </Box>
      <Typography variant="h4" component="div" fontWeight="bold" color={color}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
)

// Employee cost analysis component
const EmployeeCostAnalysis: React.FC<{ data: any }> = ({ data }) => {
  if (!data?.employees) return null

  const topEmployees = data.employees.slice(0, 5)
  const maxCost = Math.max(...data.employees.map((emp: any) => parseFloat(emp.annualCost)))

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top Employee Costs (Annual)
        </Typography>
        <List>
          {topEmployees.map((employee: any, index: number) => (
            <ListItem key={employee.employeeId} divider={index < topEmployees.length - 1}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: COLORS.chart[index % COLORS.chart.length] }}>
                  {employee.name.charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={employee.name}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {employee.position} • {employee.department}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <LinearProgress
                        variant="determinate"
                        value={(parseFloat(employee.annualCost) / maxCost) * 100}
                        sx={{ flexGrow: 1, mr: 2, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        ${parseFloat(employee.annualCost).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  )
}

// Token usage pie chart component
const TokenUsageChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Token Distribution
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ symbol, percentage }) => `${symbol} ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Payment trends chart component
const PaymentTrendsChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Payment Trends (Last 6 Months)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill={COLORS.primary} name="Payment Count" />
            <Line yAxisId="right" type="monotone" dataKey="amount" stroke={COLORS.secondary} name="Amount (ETH)" />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Department breakdown chart
const DepartmentBreakdownChart: React.FC<{ data: any[] }> = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Department Breakdown
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="department" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="employeeCount" fill={COLORS.success} name="Employee Count" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

const Analytics: React.FC = () => {
  const { analytics, loading, error, refreshAnalytics } = useAnalytics()
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('advanced')
  const [employeeCosts, setEmployeeCosts] = useState<any>(null)
  const [paymentTrends, setPaymentTrends] = useState<any>(null)
  const [timeRange, setTimeRange] = useState('monthly')
  const [loadingCosts, setLoadingCosts] = useState(false)
  const [loadingTrends, setLoadingTrends] = useState(false)

  const handleRefresh = async () => {
    await refreshAnalytics()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export analytics data')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={handleRefresh}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    )
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics data available. Please ensure you have employees and payroll data.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into your payroll operations and employee costs
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'advanced'}
                onChange={(e) => setViewMode(e.target.checked ? 'advanced' : 'basic')}
                color="primary"
              />
            }
            label="Advanced Mode"
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton onClick={handleExport} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* View Mode Tabs */}
      <Box mb={3}>
        <Tabs value={viewMode} onChange={(_, newValue) => setViewMode(newValue)}>
          <Tab 
            label="Basic Analytics" 
            icon={<Assessment />} 
            value="basic"
          />
          <Tab 
            label="Advanced Analytics" 
            icon={<AnalyticsIcon />} 
            value="advanced"
          />
        </Tabs>
      </Box>

      {/* Render appropriate view */}
      {viewMode === 'advanced' ? (
        <AdvancedAnalyticsDashboard />
      ) : (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Employees"
                value={analytics.totalEmployees}
                icon={<People />}
                color={COLORS.primary}
                subtitle={`${analytics.activeEmployees} active`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Monthly Payroll"
                value={`${parseFloat(analytics.monthlyPayrollAmount).toLocaleString()} ETH`}
                icon={<AttachMoney />}
                color={COLORS.success}
                subtitle="Current month"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Bonuses"
                value={`${parseFloat(analytics.totalBonuses).toLocaleString()} ETH`}
                icon={<AccountBalanceWallet />}
                color={COLORS.warning}
                subtitle="All time"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Completed Payments"
                value={analytics.completedPayments}
                icon={<Timeline />}
                color={COLORS.info}
                subtitle={`${analytics.pendingPayments} pending`}
              />
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} mb={3}>
            {/* Payment Trends */}
            <Grid item xs={12} lg={8}>
              <PaymentTrendsChart data={analytics.paymentTrends} />
            </Grid>

            {/* Token Usage */}
            <Grid item xs={12} lg={4}>
              <TokenUsageChart data={analytics.tokenUsage} />
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            {/* Department Breakdown */}
            <Grid item xs={12} md={6}>
              <DepartmentBreakdownChart data={analytics.departmentBreakdown} />
            </Grid>

            {/* Employee Cost Analysis */}
            <Grid item xs={12} md={6}>
              <EmployeeCostAnalysis data={employeeCosts} />
            </Grid>
          </Grid>

          {/* Summary Statistics */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={COLORS.primary} fontWeight="bold">
                      {analytics.totalEmployees}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Employees
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={COLORS.success} fontWeight="bold">
                      {parseFloat(analytics.totalPayrollAmount).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Payroll (ETH)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={COLORS.warning} fontWeight="bold">
                      {analytics.departmentBreakdown.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Departments
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color={COLORS.info} fontWeight="bold">
                      {analytics.tokenUsage.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment Tokens
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default Analytics
