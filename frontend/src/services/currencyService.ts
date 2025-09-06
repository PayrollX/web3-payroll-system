/**
 * Currency Conversion Service
 * Provides real-time USD to ETH conversion using CoinGecko API
 * @author Dev Austin
 */

export interface CurrencyRates {
  eth: number
  usd: number
  lastUpdated: number
}

export interface ConversionResult {
  fromAmount: number
  toAmount: number
  fromCurrency: 'ETH' | 'USD'
  toCurrency: 'ETH' | 'USD'
  rate: number
  timestamp: number
}

class CurrencyService {
  private rates: CurrencyRates | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 60000 // 1 minute cache
  private readonly API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

  /**
   * Fetch current ETH to USD exchange rate
   */
  async fetchExchangeRate(): Promise<CurrencyRates> {
    const now = Date.now()
    
    // Return cached data if still fresh
    if (this.rates && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.rates
    }

    try {
      console.log('🔄 Fetching current ETH/USD exchange rate...')
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.ethereum || !data.ethereum.usd) {
        throw new Error('Invalid response format from CoinGecko API')
      }

      const ethPrice = data.ethereum.usd
      
      this.rates = {
        eth: 1, // 1 ETH = 1 ETH
        usd: ethPrice, // 1 ETH = $X USD
        lastUpdated: now
      }

      this.lastFetch = now
      
      console.log(`✅ ETH/USD rate updated: $${ethPrice.toFixed(2)} per ETH`)
      
      return this.rates
    } catch (error) {
      console.error('❌ Failed to fetch exchange rate:', error)
      
      // Return fallback rate if API fails
      const fallbackRate = {
        eth: 1,
        usd: 2500, // Fallback rate: $2500 per ETH
        lastUpdated: now
      }
      
      console.log(`⚠️ Using fallback rate: $${fallbackRate.usd} per ETH`)
      return fallbackRate
    }
  }

  /**
   * Convert USD to ETH
   */
  async convertUsdToEth(usdAmount: number): Promise<ConversionResult> {
    const rates = await this.fetchExchangeRate()
    const ethAmount = usdAmount / rates.usd
    
    return {
      fromAmount: usdAmount,
      toAmount: ethAmount,
      fromCurrency: 'USD',
      toCurrency: 'ETH',
      rate: rates.usd,
      timestamp: Date.now()
    }
  }

  /**
   * Convert ETH to USD
   */
  async convertEthToUsd(ethAmount: number): Promise<ConversionResult> {
    const rates = await this.fetchExchangeRate()
    const usdAmount = ethAmount * rates.usd
    
    return {
      fromAmount: ethAmount,
      toAmount: usdAmount,
      fromCurrency: 'ETH',
      toCurrency: 'USD',
      rate: rates.usd,
      timestamp: Date.now()
    }
  }

  /**
   * Get current exchange rate
   */
  async getCurrentRate(): Promise<number> {
    const rates = await this.fetchExchangeRate()
    return rates.usd
  }

  /**
   * Format currency amount with proper precision
   */
  formatCurrency(amount: number, currency: 'ETH' | 'USD'): string {
    if (currency === 'ETH') {
      // ETH: Show up to 6 decimal places, remove trailing zeros
      return `${amount.toFixed(6).replace(/\.?0+$/, '')} ETH`
    } else {
      // USD: Show 2 decimal places
      return `$${amount.toFixed(2)}`
    }
  }

  /**
   * Validate currency input
   */
  validateCurrencyInput(value: string, currency: 'ETH' | 'USD'): { valid: boolean; error?: string } {
    if (!value.trim()) {
      return { valid: false, error: 'Amount is required' }
    }

    const numValue = parseFloat(value)
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Invalid number format' }
    }

    if (numValue < 0) {
      return { valid: false, error: 'Amount must be positive' }
    }

    if (currency === 'ETH') {
      if (numValue > 1000) {
        return { valid: false, error: 'ETH amount too high (max 1000 ETH)' }
      }
      if (numValue < 0.000001) {
        return { valid: false, error: 'ETH amount too low (min 0.000001 ETH)' }
      }
    } else {
      if (numValue > 10000000) {
        return { valid: false, error: 'USD amount too high (max $10,000,000)' }
      }
      if (numValue < 0.01) {
        return { valid: false, error: 'USD amount too low (min $0.01)' }
      }
    }

    return { valid: true }
  }
}

// Export singleton instance
export const currencyService = new CurrencyService()
export default currencyService
