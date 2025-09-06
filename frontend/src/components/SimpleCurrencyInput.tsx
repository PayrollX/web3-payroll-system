/**
 * Simple Currency Input Component for Testing
 * @author Dev Austin
 */

import React, { useState } from 'react'
import { TextField, Box, Typography, Button } from '@mui/material'

interface SimpleCurrencyInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  label?: string
  required?: boolean
  showConversion?: boolean
}

const SimpleCurrencyInput: React.FC<SimpleCurrencyInputProps> = ({
  value,
  onChange,
  error,
  helperText,
  label = 'Salary Amount',
  required = false,
  showConversion = true
}) => {
  const [currency, setCurrency] = useState<'ETH' | 'USD'>('ETH')

  const handleCurrencyToggle = () => {
    setCurrency(prev => prev === 'ETH' ? 'USD' : 'ETH')
  }

  return (
    <Box>
      <TextField
        fullWidth
        label={`${label} (${currency})`}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error || helperText}
        required={required}
        InputProps={{
          endAdornment: (
            <Button
              size="small"
              onClick={handleCurrencyToggle}
              variant="outlined"
              sx={{ ml: 1 }}
            >
              {currency === 'ETH' ? 'USD' : 'ETH'}
            </Button>
          )
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💱 Currency conversion will be available soon
      </Typography>
    </Box>
  )
}

export default SimpleCurrencyInput
