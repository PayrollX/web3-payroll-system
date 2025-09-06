/**
 * Professional Currency Input Component
 * Provides dual currency input with real-time conversion
 * @author Dev Austin
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  useTheme,
  alpha
} from '@mui/material'
import {
  SwapHoriz as SwapIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as UsdIcon,
  Diamond as EthIcon
} from '@mui/icons-material'
import { useCurrencyConversion } from '../hooks/useCurrencyConversion'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  label?: string
  disabled?: boolean
  required?: boolean
  showConversion?: boolean
  autoFocus?: boolean
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  error,
  helperText,
  label = 'Salary Amount',
  disabled = false,
  required = false,
  showConversion = true,
  autoFocus = false
}) => {
  const theme = useTheme()
  const [inputCurrency, setInputCurrency] = useState<'ETH' | 'USD'>('ETH')
  const [isConverting, setIsConverting] = useState(false)
  const isInternalUpdate = useRef(false)
  
  const {
    ethAmount,
    usdAmount,
    currentRate,
    isLoading,
    error: conversionError,
    setEthAmount,
    setUsdAmount,
    refreshRate,
    clearError
  } = useCurrencyConversion()

  // Sync with parent value only when it changes externally
  useEffect(() => {
    if (!isInternalUpdate.current && value && value !== getCurrentValue()) {
      if (inputCurrency === 'ETH') {
        setEthAmount(value)
      } else {
        setUsdAmount(value)
      }
    }
  }, [value, inputCurrency])

  // Update parent when internal state changes (but not during external updates)
  useEffect(() => {
    if (!isInternalUpdate.current) {
      const currentValue = getCurrentValue()
      if (currentValue && currentValue !== value) {
        isInternalUpdate.current = true
        onChange(currentValue)
        setTimeout(() => {
          isInternalUpdate.current = false
        }, 0)
      }
    }
  }, [ethAmount, usdAmount, inputCurrency])

  const handleCurrencySwap = async () => {
    setIsConverting(true)
    isInternalUpdate.current = true
    try {
      const newCurrency = inputCurrency === 'ETH' ? 'USD' : 'ETH'
      setInputCurrency(newCurrency)
      
      // Trigger conversion
      if (newCurrency === 'USD' && ethAmount) {
        await setUsdAmount(ethAmount)
      } else if (newCurrency === 'ETH' && usdAmount) {
        await setEthAmount(usdAmount)
      }
    } catch (error) {
      console.error('Currency swap failed:', error)
    } finally {
      setIsConverting(false)
      setTimeout(() => {
        isInternalUpdate.current = false
      }, 0)
    }
  }

  const handleInputChange = (newValue: string) => {
    isInternalUpdate.current = true
    if (inputCurrency === 'ETH') {
      setEthAmount(newValue)
    } else {
      setUsdAmount(newValue)
    }
    setTimeout(() => {
      isInternalUpdate.current = false
    }, 0)
  }

  const getCurrentValue = () => {
    return inputCurrency === 'ETH' ? ethAmount : usdAmount
  }

  const getConvertedValue = () => {
    return inputCurrency === 'ETH' ? usdAmount : ethAmount
  }

  const getCurrencyIcon = (currency: 'ETH' | 'USD') => {
    return currency === 'ETH' ? <EthIcon /> : <UsdIcon />
  }

  const getCurrencyColor = (currency: 'ETH' | 'USD') => {
    return currency === 'ETH' ? theme.palette.primary.main : theme.palette.success.main
  }

  return (
    <Box>
      {/* Main Input Section */}
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          label={`${label} (${inputCurrency})`}
          type="number"
          value={getCurrentValue()}
          onChange={(e) => handleInputChange(e.target.value)}
          error={!!error || !!conversionError}
          helperText={error || conversionError || helperText}
          disabled={disabled || isLoading}
          required={required}
          autoFocus={autoFocus}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {getCurrencyIcon(inputCurrency)}
                <Typography variant="body2" sx={{ ml: 0.5, color: getCurrencyColor(inputCurrency) }}>
                  {inputCurrency}
                </Typography>
              </Box>
            ),
            endAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isLoading && <CircularProgress size={16} />}
                <Tooltip title="Refresh Exchange Rate">
                  <IconButton
                    size="small"
                    onClick={refreshRate}
                    disabled={isLoading}
                    sx={{ color: 'text.secondary' }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={`Switch to ${inputCurrency === 'ETH' ? 'USD' : 'ETH'}`}>
                  <IconButton
                    size="small"
                    onClick={handleCurrencySwap}
                    disabled={isConverting || isLoading}
                    sx={{ 
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1)
                      }
                    }}
                  >
                    <SwapIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }}
        />
      </Box>

      {/* Exchange Rate Display */}
      {currentRate && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<TrendingUpIcon />}
            label={`1 ETH = $${currentRate.toFixed(2)}`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Typography variant="caption" color="text.secondary">
            Live rate
          </Typography>
        </Box>
      )}

      {/* Conversion Display */}
      {showConversion && getConvertedValue() && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Equivalent:
            </Typography>
            <Chip
              icon={getCurrencyIcon(inputCurrency === 'ETH' ? 'USD' : 'ETH')}
              label={`${getConvertedValue()} ${inputCurrency === 'ETH' ? 'USD' : 'ETH'}`}
              size="small"
              sx={{
                backgroundColor: alpha(getCurrencyColor(inputCurrency === 'ETH' ? 'USD' : 'ETH'), 0.1),
                color: getCurrencyColor(inputCurrency === 'ETH' ? 'USD' : 'ETH'),
                border: `1px solid ${alpha(getCurrencyColor(inputCurrency === 'ETH' ? 'USD' : 'ETH'), 0.3)}`
              }}
            />
          </Stack>
        </Box>
      )}

      {/* Error Display */}
      {conversionError && (
        <Alert severity="warning" sx={{ mt: 1 }} onClose={clearError}>
          {conversionError}
        </Alert>
      )}
    </Box>
  )
}

export default CurrencyInput
