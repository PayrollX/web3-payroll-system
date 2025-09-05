/**
 * Dashboard Data Service
 * Fetches real-time data for dashboard metrics
 * @author Dev Austin
 */

import { useAccount } from 'wagmi'
import { usePublicClient, useWalletClient } from 'wagmi'
import { formatEther } from 'viem'
import { apiService, EmployeeData, AnalyticsData } from './apiService'
import { TOKEN_ADDRESSES } from '../contracts/constants'

export interface DashboardMetrics {
  totalEmployees: number
  activeEmployees: number
  contractBalance: string
  monthlyPayroll: string
  pendingPayments: number
  loading: boolean
  error: string | null
  lastUpdated: Date
}

export interface ContractBalance {
  eth: string
  usdc?: string
  dai?: string
  loading: boolean
  error: string | null
}

/**
 * Enhanced Dashboard Service
 * Combines API data with blockchain data for comprehensive metrics
 */
export class DashboardService {
  private static instance: DashboardService
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 30000 // 30 seconds

  static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService()
    }
    return DashboardService.instance
  }

  /**
   * Get cached data or fetch new data
   */
  private async getCachedData<T>(
    key: string,
    fetchFn: () => Promise<T>,
    useCache = true
  ): Promise<T> {
    if (useCache) {
      const cached = this.cache.get(key)
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data
      }
    }

    try {
      const data = await fetchFn()
      this.cache.set(key, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      // Return cached data if available, even if expired
      const cached = this.cache.get(key)
      if (cached) {
        console.warn(`Using expired cache for ${key}:`, error)
        return cached.data
      }
      throw error
    }
  }

  /**
   * Fetch employee data from API
   */
  async getEmployeeMetrics(walletAddress: string): Promise<{
    totalEmployees: number
    activeEmployees: number
    employees: EmployeeData[]
  }> {
    return this.getCachedData(
      `employees_${walletAddress}`,
      async () => {
        console.log('🔍 DashboardService: Fetching employee metrics for:', walletAddress)
        
        const response = await apiService.getEmployees()
        
        if (response.success && response.data) {
          const employees = response.data.employees || []
          const totalEmployees = response.data.total || employees.length
          const activeEmployees = employees.filter(emp => 
            emp?.employmentDetails?.isActive
          ).length

          console.log('✅ DashboardService: Employee metrics loaded:', {
            total: totalEmployees,
            active: activeEmployees,
            employees: employees.length
          })

          return {
            totalEmployees,
            activeEmployees,
            employees
          }
        } else {
          console.warn('⚠️ DashboardService: Employee API response failed:', response)
          return {
            totalEmployees: 0,
            activeEmployees: 0,
            employees: []
          }
        }
      }
    )
  }

  /**
   * Fetch contract balance from blockchain
   */
  async getContractBalance(
    walletAddress: string,
    publicClient: any,
    chainId: number
  ): Promise<ContractBalance> {
    return this.getCachedData(
      `balance_${walletAddress}_${chainId}`,
      async () => {
        console.log('🔍 DashboardService: Fetching contract balance for:', walletAddress)
        
        try {
          // Get ETH balance
          const ethBalance = await publicClient.getBalance({
            address: walletAddress as `0x${string}`
          })
          
          const ethFormatted = formatEther(ethBalance)
          
          console.log('✅ DashboardService: Contract balance loaded:', {
            eth: ethFormatted,
            chainId
          })

          return {
            eth: ethFormatted,
            loading: false,
            error: null
          }
        } catch (error: any) {
          console.error('❌ DashboardService: Error fetching contract balance:', error)
          return {
            eth: '0',
            loading: false,
            error: error.message || 'Failed to fetch balance'
          }
        }
      }
    )
  }

  /**
   * Fetch analytics data from API
   */
  async getAnalyticsMetrics(walletAddress: string): Promise<{
    monthlyPayroll: string
    pendingPayments: number
    analytics: AnalyticsData | null
  }> {
    return this.getCachedData(
      `analytics_${walletAddress}`,
      async () => {
        console.log('🔍 DashboardService: Fetching analytics metrics for:', walletAddress)
        
        try {
          const response = await apiService.getPayrollSummary()
          
          if (response.success && response.data) {
            const analytics = response.data
            
            console.log('✅ DashboardService: Analytics metrics loaded:', {
              monthlyPayroll: analytics.monthlyPayrollAmount,
              pendingPayments: analytics.pendingPayments
            })

            return {
              monthlyPayroll: analytics.monthlyPayrollAmount || '0',
              pendingPayments: analytics.pendingPayments || 0,
              analytics
            }
          } else {
            console.warn('⚠️ DashboardService: Analytics API response failed:', response)
            return {
              monthlyPayroll: '0',
              pendingPayments: 0,
              analytics: null
            }
          }
        } catch (error: any) {
          console.error('❌ DashboardService: Error fetching analytics:', error)
          return {
            monthlyPayroll: '0',
            pendingPayments: 0,
            analytics: null
          }
        }
      }
    )
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(
    walletAddress: string,
    publicClient: any,
    chainId: number
  ): Promise<DashboardMetrics> {
    console.log('🚀 DashboardService: Loading comprehensive dashboard metrics')
    
    try {
      const [employeeMetrics, balanceData, analyticsMetrics] = await Promise.all([
        this.getEmployeeMetrics(walletAddress),
        this.getContractBalance(walletAddress, publicClient, chainId),
        this.getAnalyticsMetrics(walletAddress)
      ])

      const metrics: DashboardMetrics = {
        totalEmployees: employeeMetrics.totalEmployees,
        activeEmployees: employeeMetrics.activeEmployees,
        contractBalance: balanceData.eth,
        monthlyPayroll: analyticsMetrics.monthlyPayroll,
        pendingPayments: analyticsMetrics.pendingPayments,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }

      console.log('✅ DashboardService: Dashboard metrics loaded successfully:', metrics)
      return metrics

    } catch (error: any) {
      console.error('❌ DashboardService: Error loading dashboard metrics:', error)
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        contractBalance: '0',
        monthlyPayroll: '0',
        pendingPayments: 0,
        loading: false,
        error: error.message || 'Failed to load dashboard data',
        lastUpdated: new Date()
      }
    }
  }

  /**
   * Clear cache for specific wallet
   */
  clearCache(walletAddress?: string): void {
    if (walletAddress) {
      // Clear specific wallet cache
      // Convert iterator to array to avoid downlevel iteration issues
      Array.from(this.cache.keys()).forEach(key => {
        if (key.includes(walletAddress)) {
          this.cache.delete(key)
        }
      })
    } else {
      // Clear all cache
      this.cache.clear()
    }
    console.log('🧹 DashboardService: Cache cleared for', walletAddress || 'all wallets')
  }

  /**
   * Force refresh data (bypass cache)
   */
  async refreshDashboardMetrics(
    walletAddress: string,
    publicClient: any,
    chainId: number
  ): Promise<DashboardMetrics> {
    this.clearCache(walletAddress)
    return this.getDashboardMetrics(walletAddress, publicClient, chainId)
  }
}

// Export singleton instance
export const dashboardService = DashboardService.getInstance()

/**
 * React hook for dashboard metrics
 */
export const useDashboardMetrics = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEmployees: 0,
    activeEmployees: 0,
    contractBalance: '0',
    monthlyPayroll: '0',
    pendingPayments: 0,
    loading: true,
    error: null,
    lastUpdated: new Date()
  })

  const loadMetrics = useCallback(async () => {
    if (!address || !publicClient) {
      setMetrics(prev => ({ ...prev, loading: false }))
      return
    }

    setMetrics(prev => ({ ...prev, loading: true, error: null }))

    try {
      const chainId = publicClient.chain?.id || 31337 // Default to hardhat
      const newMetrics = await dashboardService.getDashboardMetrics(
        address,
        publicClient,
        chainId
      )
      setMetrics(newMetrics)
    } catch (error: any) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }))
    }
  }, [address, publicClient])

  const refreshMetrics = useCallback(async () => {
    if (!address || !publicClient) return

    setMetrics(prev => ({ ...prev, loading: true, error: null }))

    try {
      const chainId = publicClient.chain?.id || 31337
      const newMetrics = await dashboardService.refreshDashboardMetrics(
        address,
        publicClient,
        chainId
      )
      setMetrics(newMetrics)
    } catch (error: any) {
      setMetrics(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to refresh dashboard data'
      }))
    }
  }, [address, publicClient])

  // Load metrics on mount and when dependencies change
  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!address) return

    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [loadMetrics, address])

  return {
    ...metrics,
    refresh: refreshMetrics,
    reload: loadMetrics
  }
}

// Import React hooks
import { useState, useEffect, useCallback } from 'react'
