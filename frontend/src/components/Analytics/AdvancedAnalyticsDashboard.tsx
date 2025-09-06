/**
 * Advanced Analytics Dashboard Component
 * Provides comprehensive analytics with real-time updates and advanced insights
 * @author Dev Austin
 */

import React, { useState, useEffect } from 'react'
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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Badge,
  Switch,
  FormControlLabel,
  TextField,
  InputAdornment
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
  ExpandMore,
  Lightbulb,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  Speed,
  Security,
  Analytics as AnalyticsIcon,
  Insights,
  Compare,
  DateRange,
  Search
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
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { useEnhancedAnalytics } from '../../hooks/useEnhancedAnalytics'

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

// Custom tooltip component
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

// Advanced metric card with trend indicators
const AdvancedMetricCard: React.FC<{
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
  color?: string
  subtitle?: string
  loading?: boolean
  badge?: string
}> = ({ title, value, change, trend, icon, color = COLORS.primary, subtitle, loading, badge }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
    {badge && (
      <Chip
        label={badge}
        size="small"
        color="primary"
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
      />
    )}
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              bgcolor: color,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Box display="flex" alignItems="center" gap={0.5}>
              {trend === 'up' && <TrendingUp color="success" fontSize="small" />}
              {trend === 'down' && <TrendingDown color="error" fontSize="small" />}
              {trend === 'stable' && <Timeline color="info" fontSize="small" />}
            </Box>
          )}
        </Box>
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
      
      {loading ? (
        <Box display="flex" alignItems="center" gap={2}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      ) : (
        <>
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
        </>
      )}
    </CardContent>
  </Card>
)

// Performance radar chart
const PerformanceRadarChart: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null

  const radarData = [
    { subject: 'Success Rate', A: data.successRate, fullMark: 100 },
    { subject: 'Gas Efficiency', A: data.gasEfficiency, fullMark: 100 },
    { subject: 'ROI', A: Math.min(data.roi / 10, 100), fullMark: 100 },
    { subject: 'Cost Reduction', A: data.costReduction, fullMark: 100 },
    { subject: 'Revenue Growth', A: data.revenueGrowth, fullMark: 100 },
    { subject: 'User Engagement', A: Math.min(data.activeUsers * 10, 100), fullMark: 100 }
  ]

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Performance Overview
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Performance"
              dataKey="A"
              stroke={COLORS.primary}
              fill={COLORS.primary}
              fillOpacity={0.3}
            />
            <RechartsTooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Insights panel
const InsightsPanel: React.FC<{ insights: any }> = ({ insights }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Insights & Recommendations
      </Typography>
      
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Cost Optimization</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {insights.costOptimizationOpportunities.map((opportunity: string, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Lightbulb color="warning" />
                </ListItemIcon>
                <ListItemText primary={opportunity} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Performance Recommendations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <List dense>
            {insights.recommendations.map((recommendation: string, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary={recommendation} />
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1">Growth Trends</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color={COLORS.success}>
                  {insights.growthTrends.payroll.toFixed(1)}%
                </Typography>
                <Typography variant="caption">Payroll Growth</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color={COLORS.info}>
                  {insights.growthTrends.employees.toFixed(1)}%
                </Typography>
                <Typography variant="caption">Employee Growth</Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Typography variant="h6" color={COLORS.warning}>
                  {insights.growthTrends.efficiency.toFixed(1)}%
                </Typography>
                <Typography variant="caption">Efficiency</Typography>
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </CardContent>
  </Card>
)

// Real-time status indicator
const RealTimeStatus: React.FC<{ isRealTime: boolean; onToggle: (enabled: boolean) => void }> = ({ 
  isRealTime, 
  onToggle 
}) => (
  <Box display="flex" alignItems="center" gap={1}>
    <FormControlLabel
      control={
        <Switch
          checked={isRealTime}
          onChange={(e) => onToggle(e.target.checked)}
          color="primary"
        />
      }
      label="Real-time"
    />
    <Chip
      icon={isRealTime ? <Schedule /> : <Speed />}
      label={isRealTime ? 'Live' : 'Static'}
      color={isRealTime ? 'success' : 'default'}
      size="small"
    />
  </Box>
)

const AdvancedAnalyticsDashboard: React.FC = () => {
  const {
    metrics,
    employeeCosts,
    performance,
    loading,
    loadingMetrics,
    loadingCosts,
    loadingPerformance,
    error,
    metricsError,
    costsError,
    performanceError,
    refreshAll,
    refreshMetrics,
    refreshCosts,
    refreshPerformance,
    exportData,
    insights
  } = useEnhancedAnalytics()

  const [activeTab, setActiveTab] = useState(0)
  const [timeRange, setTimeRange] = useState('monthly')
  const [isRealTime, setIsRealTime] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && isRealTime) {
      const interval = setInterval(() => {
        refreshAll()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, isRealTime, refreshAll])

  const handleExport = async (format: 'csv' | 'json' = 'csv') => {
    try {
      const data = await exportData(format)
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleRealTimeToggle = (enabled: boolean) => {
    setIsRealTime(enabled)
    if (enabled) {
      setAutoRefresh(true)
    }
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
        <Button color="inherit" size="small" onClick={refreshAll}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    )
  }

  if (!metrics) {
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
            Advanced Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights with AI-powered recommendations and real-time monitoring
          </Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: 200 }}
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
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </Select>
          </FormControl>
          <RealTimeStatus isRealTime={isRealTime} onToggle={handleRealTimeToggle} />
          <Tooltip title="Refresh All Data">
            <IconButton onClick={refreshAll} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={() => handleExport('csv')} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tabs for different views */}
      <Box mb={3}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" icon={<Assessment />} />
          <Tab label="Performance" icon={<Speed />} />
          <Tab label="Costs" icon={<AttachMoney />} />
          <Tab label="Insights" icon={<Insights />} />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <AdvancedMetricCard
                title="Total Employees"
                value={metrics.totalEmployees}
                change={insights.growthTrends.employees}
                trend="up"
                icon={<People />}
                color={COLORS.primary}
                subtitle={`${metrics.activeEmployees} active`}
                loading={loadingMetrics}
                badge="Live"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AdvancedMetricCard
                title="Monthly Payroll"
                value={`${parseFloat(metrics.monthlyPayrollAmount).toLocaleString()} ETH`}
                change={insights.growthTrends.payroll}
                trend="up"
                icon={<AttachMoney />}
                color={COLORS.success}
                subtitle="Current month"
                loading={loadingMetrics}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AdvancedMetricCard
                title="Success Rate"
                value={`${performance?.successRate.toFixed(1) || 0}%`}
                trend="stable"
                icon={<CheckCircle />}
                color={COLORS.success}
                subtitle="Transaction success"
                loading={loadingPerformance}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AdvancedMetricCard
                title="ROI"
                value={`${performance?.roi.toFixed(1) || 0}%`}
                trend="up"
                icon={<TrendingUp />}
                color={COLORS.warning}
                subtitle="Return on investment"
                loading={loadingPerformance}
              />
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Trends Analysis
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={metrics.paymentTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="paymentCount" fill={COLORS.primary} name="Payment Count" />
                      <Line yAxisId="right" type="monotone" dataKey="totalAmount" stroke={COLORS.secondary} name="Amount (ETH)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Token Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={metrics.tokenUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ symbol, percentage }) => `${symbol} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {metrics.tokenUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Performance Tab */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <PerformanceRadarChart data={performance} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Performance Metrics
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Speed color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Average Transaction Time"
                      secondary={`${performance?.averageTransactionTime || 0} seconds`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Security color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Success Rate"
                      secondary={`${performance?.successRate || 0}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccountBalanceWallet color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Gas Efficiency"
                      secondary={`${performance?.gasEfficiency || 0}%`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Costs Tab */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Cost Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={metrics.departmentBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="employeeCount" fill={COLORS.success} name="Employee Count" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            {employeeCosts && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Top Employee Costs
                  </Typography>
                  <List>
                    {employeeCosts.employees.slice(0, 5).map((employee: any, index: number) => (
                      <ListItem key={employee.employeeId} divider={index < 4}>
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
                                  value={(parseFloat(employee.annualCost) / parseFloat(employeeCosts.totals.averageAnnualCost)) * 100}
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
            )}
          </Grid>
        </Grid>
      )}

      {/* Insights Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <InsightsPanel insights={insights} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={refreshMetrics}>
                    <ListItemIcon>
                      <Refresh />
                    </ListItemIcon>
                    <ListItemText primary="Refresh Metrics" />
                  </ListItem>
                  <ListItem button onClick={refreshCosts}>
                    <ListItemIcon>
                      <AttachMoney />
                    </ListItemIcon>
                    <ListItemText primary="Update Costs" />
                  </ListItem>
                  <ListItem button onClick={refreshPerformance}>
                    <ListItemIcon>
                      <Speed />
                    </ListItemIcon>
                    <ListItemText primary="Check Performance" />
                  </ListItem>
                  <ListItem button onClick={() => handleExport('json')}>
                    <ListItemIcon>
                      <Download />
                    </ListItemIcon>
                    <ListItemText primary="Export JSON" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default AdvancedAnalyticsDashboard
