import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  InputAdornment,
  Tooltip,
  IconButton,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Token as TokenIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Savings as SavingsIcon,
  AccountBalance as BankIcon,
  Help as HelpIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts'
import { useFormStore } from '../EmployeeOnboardingForm'

interface PayrollStepProps {
  onProgressUpdate: (progress: number) => void
}

// Mock token data with real-time prices (in production, this would come from an API)
const tokens = {
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2890.45,
    stability: 'Medium',
    stabilityScore: 60,
    icon: '⟠',
    description: 'Native cryptocurrency with growth potential'
  },
  USDC: {
    name: 'USD Coin',
    symbol: 'USDC',
    price: 1.00,
    stability: 'High',
    stabilityScore: 95,
    icon: '💰',
    description: 'Stablecoin pegged to USD'
  },
  USDT: {
    name: 'Tether',
    symbol: 'USDT',
    price: 0.9998,
    stability: 'High',
    stabilityScore: 94,
    icon: '💵',
    description: 'Most widely used stablecoin'
  },
  DAI: {
    name: 'Dai',
    symbol: 'DAI',
    price: 1.001,
    stability: 'High',
    stabilityScore: 92,
    icon: '🟡',
    description: 'Decentralized stablecoin'
  }
}

const paymentFrequencies = [
  { value: 'Weekly', label: 'Weekly', description: 'Every 7 days' },
  { value: 'Bi-weekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'Monthly', label: 'Monthly', description: 'Once per month' },
  { value: 'Quarterly', label: 'Quarterly', description: 'Every 3 months' }
]

const taxJurisdictions = [
  'United States',
  'Canada',
  'United Kingdom',
  'European Union',
  'Singapore',
  'Australia',
  'Other'
]

/**
 * 💰 Smart Payroll Configuration Step
 * 
 * This step handles:
 * - Salary and currency setup
 * - Payment frequency and token preferences
 * - Advanced auto-conversion settings
 * - Payment splitting for DeFi
 * - Tax jurisdiction compliance
 * - Emergency payment methods
 */
export const PayrollStep: React.FC<PayrollStepProps> = ({ onProgressUpdate }) => {
  const { formData, updateFormData, errors } = useFormStore()
  const payrollData = formData.payroll || {}

  const [usdEquivalent, setUsdEquivalent] = useState(0)
  const [pieChartData, setPieChartData] = useState<any[]>([])

  // Calculate step progress
  useEffect(() => {
    const requiredFields = ['salary', 'currency', 'frequency', 'preferredToken', 'taxJurisdiction']
    const completedFields = requiredFields.filter(field => 
      payrollData[field as keyof typeof payrollData]
    ).length
    
    const progress = (completedFields / requiredFields.length) * 100
    onProgressUpdate(progress)
  }, [payrollData, onProgressUpdate])

  // Calculate USD equivalent
  useEffect(() => {
    if (payrollData.salary && payrollData.preferredToken) {
      const salary = parseFloat(payrollData.salary) || 0
      const token = tokens[payrollData.preferredToken as keyof typeof tokens]
      const equivalent = salary * (token?.price || 1)
      setUsdEquivalent(equivalent)
    }
  }, [payrollData.salary, payrollData.preferredToken])

  // Update pie chart data when payment splitting changes
  useEffect(() => {
    if (payrollData.paymentSplitting?.enabled) {
      const splitting = payrollData.paymentSplitting
      const data = [
        { name: 'Main Wallet', value: splitting.mainWallet || 70, color: '#6366f1' },
        { name: 'Savings', value: splitting.savingsWallet || 20, color: '#10b981' },
        { name: 'DeFi Protocols', value: splitting.defiProtocols || 10, color: '#f59e0b' }
      ]
      setPieChartData(data)
    }
  }, [payrollData.paymentSplitting])

  const handleInputChange = (field: string) => (event: any) => {
    const value = event.target ? event.target.value : event
    updateFormData('payroll', { [field]: value })
  }

  const handleSplittingChange = (field: string) => (event: any) => {
    const value = event.target ? event.target.value : event
    const splitting = payrollData.paymentSplitting || {}
    
    updateFormData('payroll', {
      paymentSplitting: {
        ...splitting,
        [field]: value
      }
    })
  }

  const handleAutoConversionChange = (field: string) => (event: any) => {
    const value = event.target ? event.target.value : event
    const autoConversion = payrollData.autoConversion || {}
    
    updateFormData('payroll', {
      autoConversion: {
        ...autoConversion,
        [field]: value
      }
    })
  }

  const getTokenStabilityColor = (stability: string) => {
    switch (stability) {
      case 'High': return 'success.main'
      case 'Medium': return 'warning.main'
      case 'Low': return 'error.main'
      default: return 'text.secondary'
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        💰 Configure your smart payroll
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Set up intelligent payment preferences with DeFi features and auto-optimization.
      </Typography>

      <Grid container spacing={4}>
        {/* Basic Salary Configuration */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                💵 Salary Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="Annual Salary"
                type="number"
                value={payrollData.salary || ''}
                onChange={handleInputChange('salary')}
                error={!!errors.salary}
                helperText={errors.salary || 'Enter your annual salary amount'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Base Currency</InputLabel>
                <Select
                  value={payrollData.currency || 'USD'}
                  onChange={handleInputChange('currency')}
                  error={!!errors.currency}
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Payment Frequency</InputLabel>
                <Select
                  value={payrollData.frequency || ''}
                  onChange={handleInputChange('frequency')}
                  error={!!errors.frequency}
                >
                  {paymentFrequencies.map((freq) => (
                    <MenuItem key={freq.value} value={freq.value}>
                      <Box>
                        <Typography>{freq.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {freq.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Preferred Payment Day"
                type="number"
                value={payrollData.paymentDay || 1}
                onChange={handleInputChange('paymentDay')}
                inputProps={{ min: 1, max: 28 }}
                helperText="Day of the month for salary payments (1-28)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Token Selection */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🪙 Payment Token
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Preferred Token</InputLabel>
                <Select
                  value={payrollData.preferredToken || ''}
                  onChange={handleInputChange('preferredToken')}
                  error={!!errors.preferredToken}
                >
                  {Object.entries(tokens).map(([symbol, token]) => (
                    <MenuItem key={symbol} value={symbol}>
                      <Box display="flex" alignItems="center" gap={1} width="100%">
                        <span style={{ fontSize: '1.2em' }}>{token.icon}</span>
                        <Box flex={1}>
                          <Typography>{token.name} ({symbol})</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ${token.price.toFixed(2)} • {token.stability} stability
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={token.stability}
                          color={token.stability === 'High' ? 'success' : token.stability === 'Medium' ? 'warning' : 'error'}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Token Information */}
              {payrollData.preferredToken && (
                <Paper sx={{ p: 2, bgcolor: 'info.50', border: 1, borderColor: 'info.200' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Token Details:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {tokens[payrollData.preferredToken as keyof typeof tokens]?.description}
                  </Typography>
                  
                  {usdEquivalent > 0 && (
                    <Typography variant="h6" color="primary">
                      ≈ ${usdEquivalent.toLocaleString()} USD annually
                    </Typography>
                  )}
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Auto-Conversion Settings */}
        <Grid item xs={12}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingUpIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Auto-Conversion Optimizer
                </Typography>
                <Tooltip title="Automatically convert portions of your salary for stability and growth">
                  <IconButton size="small">
                    <HelpIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={payrollData.autoConversion?.enabled || false}
                    onChange={(e) => handleAutoConversionChange('enabled')(e.target.checked)}
                  />
                }
                label="Enable auto-conversion for risk management"
                sx={{ mb: 2 }}
              />

              {payrollData.autoConversion?.enabled && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Stablecoin Allocation (Safety)
                    </Typography>
                    <Slider
                      value={payrollData.autoConversion?.stablecoinPercentage || 70}
                      onChange={(_, value) => handleAutoConversionChange('stablecoinPercentage')(value)}
                      aria-label="Stablecoin percentage"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={0}
                      max={100}
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Converted to USDC for price stability
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      ETH Allocation (Growth)
                    </Typography>
                    <Slider
                      value={payrollData.autoConversion?.ethPercentage || 30}
                      onChange={(_, value) => handleAutoConversionChange('ethPercentage')(value)}
                      aria-label="ETH percentage"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={0}
                      max={100}
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Kept in ETH for potential appreciation
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Splitting */}
        <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SavingsIcon color="primary" />
                <Typography variant="h6" color="primary">
                  Payment Splitting
                </Typography>
                <Tooltip title="Automatically split payments across multiple wallets and DeFi protocols">
                  <IconButton size="small">
                    <HelpIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={payrollData.paymentSplitting?.enabled || false}
                    onChange={(e) => handleSplittingChange('enabled')(e.target.checked)}
                  />
                }
                label="Enable automatic payment splitting"
                sx={{ mb: 2 }}
              />

              {payrollData.paymentSplitting?.enabled && (
                <Box>
                  <Grid container spacing={2} mb={3}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Main Wallet %
                      </Typography>
                      <Slider
                        value={payrollData.paymentSplitting?.mainWallet || 70}
                        onChange={(_, value) => handleSplittingChange('mainWallet')(value)}
                        valueLabelDisplay="auto"
                        step={5}
                        min={0}
                        max={100}
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Savings Wallet %
                      </Typography>
                      <Slider
                        value={payrollData.paymentSplitting?.savingsWallet || 20}
                        onChange={(_, value) => handleSplittingChange('savingsWallet')(value)}
                        valueLabelDisplay="auto"
                        step={5}
                        min={0}
                        max={100}
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        DeFi Protocols %
                      </Typography>
                      <Slider
                        value={payrollData.paymentSplitting?.defiProtocols || 10}
                        onChange={(_, value) => handleSplittingChange('defiProtocols')(value)}
                        valueLabelDisplay="auto"
                        step={5}
                        min={0}
                        max={100}
                        valueLabelFormat={(value) => `${value}%`}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Savings Wallet Address (Optional)"
                    value={payrollData.paymentSplitting?.savingsWalletAddress || ''}
                    onChange={handleSplittingChange('savingsWalletAddress')}
                    placeholder="0x..."
                    helperText="Separate wallet for automatic savings"
                    sx={{ mb: 2 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Split Visualization */}
        {payrollData.paymentSplitting?.enabled && pieChartData.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  💰 Payment Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Tax & Compliance */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📋 Tax & Compliance
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tax Jurisdiction</InputLabel>
                <Select
                  value={payrollData.taxJurisdiction || ''}
                  onChange={handleInputChange('taxJurisdiction')}
                  error={!!errors.taxJurisdiction}
                >
                  {taxJurisdictions.map((jurisdiction) => (
                    <MenuItem key={jurisdiction} value={jurisdiction}>
                      {jurisdiction}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  🛡️ We'll automatically handle tax compliance for your jurisdiction
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="Emergency Wallet Address (Optional)"
                value={payrollData.emergencyWallet || ''}
                onChange={handleInputChange('emergencyWallet')}
                placeholder="0x..."
                helperText="Backup wallet for emergency situations"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SecurityIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Summary */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3, bgcolor: 'success.50', borderColor: 'success.200', border: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                💰 Payment Summary
              </Typography>
              
              {payrollData.salary && payrollData.frequency && (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <MoneyIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`$${parseInt(payrollData.salary).toLocaleString()} ${payrollData.currency || 'USD'} annually`}
                      secondary={`Paid ${payrollData.frequency?.toLowerCase()} in ${payrollData.preferredToken || 'preferred token'}`}
                    />
                  </ListItem>
                  
                  {usdEquivalent > 0 && (
                    <ListItem>
                      <ListItemIcon>
                        <TokenIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`≈ $${usdEquivalent.toLocaleString()} USD equivalent`}
                        secondary={`At current ${payrollData.preferredToken} price`}
                      />
                    </ListItem>
                  )}

                  <ListItem>
                    <ListItemIcon>
                      <ScheduleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Payment on the ${payrollData.paymentDay || 1}${getOrdinalSuffix(payrollData.paymentDay || 1)} of each period`}
                      secondary={`Tax jurisdiction: ${payrollData.taxJurisdiction || 'Not specified'}`}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

// Helper function for ordinal numbers
function getOrdinalSuffix(day: number): string {
  const j = day % 10
  const k = day % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

export default PayrollStep



