/**
 * Currency Conversion Hook
 * Provides real-time USD/ETH conversion functionality
 * @author Dev Austin
 */

import { useState, useEffect, useCallback } from 'react'
import { currencyService, ConversionResult } from '../services/currencyService'

export interface CurrencyConversionState {
  ethAmount: string
  usdAmount: string
  currentRate: number | null
  isLoading: boolean
  error: string | null
  lastConversion: ConversionResult | null
}

export interface CurrencyConversionActions {
  setEthAmount: (amount: string) => void
  setUsdAmount: (amount: string) => void
  convertFromEth: (ethAmount: string) => Promise<void>
  convertFromUsd: (usdAmount: string) => Promise<void>
  refreshRate: () => Promise<void>
  clearError: () => void
}

export const useCurrencyConversion = (): CurrencyConversionState & CurrencyConversionActions => {
  const [ethAmount, setEthAmountState] = useState<string>('')
  const [usdAmount, setUsdAmountState] = useState<string>('')
  const [currentRate, setCurrentRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastConversion, setLastConversion] = useState<ConversionResult | null>(null)

  // Fetch initial exchange rate
  useEffect(() => {
    refreshRate()
  }, [])

  const refreshRate = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const rate = await currencyService.getCurrentRate()
      setCurrentRate(rate)
      console.log(`📊 Current ETH/USD rate: $${rate.toFixed(2)}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exchange rate'
      setError(errorMessage)
      console.error('❌ Failed to refresh exchange rate:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const convertFromEth = useCallback(async (ethValue: string) => {
    if (!ethValue.trim()) {
      setUsdAmountState('')
      setLastConversion(null)
      return
    }

    const validation = currencyService.validateCurrencyInput(ethValue, 'ETH')
    if (!validation.valid) {
      setError(validation.error || 'Invalid ETH amount')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const ethNum = parseFloat(ethValue)
      const conversion = await currencyService.convertUsdToEth(ethNum * (currentRate || 1))
      
      setUsdAmountState(conversion.fromAmount.toFixed(2))
      setLastConversion(conversion)
      
      console.log(`💱 Converted ${ethValue} ETH to $${conversion.fromAmount.toFixed(2)}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed'
      setError(errorMessage)
      console.error('❌ ETH to USD conversion failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [currentRate])

  const convertFromUsd = useCallback(async (usdValue: string) => {
    if (!usdValue.trim()) {
      setEthAmountState('')
      setLastConversion(null)
      return
    }

    const validation = currencyService.validateCurrencyInput(usdValue, 'USD')
    if (!validation.valid) {
      setError(validation.error || 'Invalid USD amount')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const usdNum = parseFloat(usdValue)
      const conversion = await currencyService.convertUsdToEth(usdNum)
      
      setEthAmountState(conversion.toAmount.toFixed(6).replace(/\.?0+$/, ''))
      setLastConversion(conversion)
      
      console.log(`💱 Converted $${usdValue} to ${conversion.toAmount.toFixed(6)} ETH`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Conversion failed'
      setError(errorMessage)
      console.error('❌ USD to ETH conversion failed:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const setEthAmount = useCallback((amount: string) => {
    setEthAmountState(amount)
    convertFromEth(amount)
  }, [convertFromEth])

  const setUsdAmount = useCallback((amount: string) => {
    setUsdAmountState(amount)
    convertFromUsd(amount)
  }, [convertFromUsd])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    ethAmount,
    usdAmount,
    currentRate,
    isLoading,
    error,
    lastConversion,
    
    // Actions
    setEthAmount,
    setUsdAmount,
    convertFromEth,
    convertFromUsd,
    refreshRate,
    clearError
  }
}


