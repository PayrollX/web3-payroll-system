/**
 * Enhanced Analytics Hook
 * Provides comprehensive analytics data with advanced metrics and insights
 * @author Dev Austin
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { 
  analyticsService, 
  AnalyticsMetrics, 
  EmployeeCostAnalysis, 
  PerformanceMetrics 
} from '../services/analyticsService'

export interface UseEnhancedAnalyticsReturn {
  // Core data
  metrics: AnalyticsMetrics | null
  employeeCosts: EmployeeCostAnalysis | null
  performance: PerformanceMetrics | null
  
  // Loading states
  loading: boolean
  loadingMetrics: boolean
  loadingCosts: boolean
  loadingPerformance: boolean
  
  // Error states
  error: string | null
  metricsError: string | null
  costsError: string | null
  performanceError: string | null
  
  // Actions
  refreshAll: () => Promise<void>
  refreshMetrics: () => Promise<void>
  refreshCosts: () => Promise<void>
  refreshPerformance: () => Promise<void>
  exportData: (format?: 'csv' | 'json') => Promise<string>
  
  // Computed insights
  insights: {
    topPerformingDepartments: string[]
    costOptimizationOpportunities: string[]
    growthTrends: {
      payroll: number
      employees: number
      efficiency: number
    }
    recommendations: string[]
  }
}

/**
 * Enhanced analytics hook with comprehensive data and insights
 */
export const useEnhancedAnalytics = (): UseEnhancedAnalyticsReturn => {
  const { address } = useAccount()
  
  // Core data state
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [employeeCosts, setEmployeeCosts] = useState<EmployeeCostAnalysis | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [loadingCosts, setLoadingCosts] = useState(false)
  const [loadingPerformance, setLoadingPerformance] = useState(false)
  
  // Error states
  const [error, setError] = useState<string | null>(null)
  const [metricsError, setMetricsError] = useState<string | null>(null)
  const [costsError, setCostsError] = useState<string | null>(null)
  const [performanceError, setPerformanceError] = useState<string | null>(null)

  // Load comprehensive metrics
  const loadMetrics = useCallback(async () => {
    if (!address) return
    
    setLoadingMetrics(true)
    setMetricsError(null)
    
    try {
      const data = await analyticsService.getComprehensiveMetrics()
      setMetrics(data)
    } catch (err: any) {
      setMetricsError(err.message || 'Failed to load metrics')
    } finally {
      setLoadingMetrics(false)
    }
  }, [address])

  // Load employee cost analysis
  const loadCosts = useCallback(async () => {
    if (!address) return
    
    setLoadingCosts(true)
    setCostsError(null)
    
    try {
      const data = await analyticsService.getEnhancedEmployeeCosts()
      setEmployeeCosts(data)
    } catch (err: any) {
      setCostsError(err.message || 'Failed to load employee costs')
    } finally {
      setLoadingCosts(false)
    }
  }, [address])

  // Load performance metrics
  const loadPerformance = useCallback(async () => {
    if (!address) return
    
    setLoadingPerformance(true)
    setPerformanceError(null)
    
    try {
      const data = await analyticsService.getPerformanceMetrics()
      setPerformance(data)
    } catch (err: any) {
      setPerformanceError(err.message || 'Failed to load performance metrics')
    } finally {
      setLoadingPerformance(false)
    }
  }, [address])

  // Load all data
  const loadAll = useCallback(async () => {
    if (!address) return
    
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        loadMetrics(),
        loadCosts(),
        loadPerformance()
      ])
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [address, loadMetrics, loadCosts, loadPerformance])

  // Refresh functions
  const refreshAll = useCallback(async () => {
    await loadAll()
  }, [loadAll])

  const refreshMetrics = useCallback(async () => {
    await loadMetrics()
  }, [loadMetrics])

  const refreshCosts = useCallback(async () => {
    await loadCosts()
  }, [loadCosts])

  const refreshPerformance = useCallback(async () => {
    await loadPerformance()
  }, [loadPerformance])

  // Export data
  const exportData = useCallback(async (format: 'csv' | 'json' = 'csv'): Promise<string> => {
    try {
      return await analyticsService.exportAnalyticsData(format)
    } catch (err: any) {
      throw new Error(err.message || 'Failed to export data')
    }
  }, [])

  // Compute insights
  const insights = {
    topPerformingDepartments: computeTopPerformingDepartments(metrics, employeeCosts),
    costOptimizationOpportunities: computeCostOptimizationOpportunities(employeeCosts),
    growthTrends: computeGrowthTrends(metrics, performance),
    recommendations: computeRecommendations(metrics, employeeCosts, performance)
  }

  // Load data on mount and when address changes
  useEffect(() => {
    if (address) {
      loadAll()
    }
  }, [loadAll, address])

  return {
    // Core data
    metrics,
    employeeCosts,
    performance,
    
    // Loading states
    loading,
    loadingMetrics,
    loadingCosts,
    loadingPerformance,
    
    // Error states
    error,
    metricsError,
    costsError,
    performanceError,
    
    // Actions
    refreshAll,
    refreshMetrics,
    refreshCosts,
    refreshPerformance,
    exportData,
    
    // Computed insights
    insights
  }
}

// Helper functions for computing insights

function computeTopPerformingDepartments(
  metrics: AnalyticsMetrics | null, 
  costs: EmployeeCostAnalysis | null
): string[] {
  if (!metrics || !costs) return []
  
  return metrics.departmentBreakdown
    .sort((a, b) => parseFloat(b.averageSalary) - parseFloat(a.averageSalary))
    .slice(0, 3)
    .map(dept => dept.department)
}

function computeCostOptimizationOpportunities(
  costs: EmployeeCostAnalysis | null
): string[] {
  if (!costs) return []
  
  return costs.insights.costOptimizationSuggestions
}

function computeGrowthTrends(
  metrics: AnalyticsMetrics | null,
  performance: PerformanceMetrics | null
): { payroll: number; employees: number; efficiency: number } {
  if (!metrics || !performance) {
    return { payroll: 0, employees: 0, efficiency: 0 }
  }
  
  return {
    payroll: metrics.payrollGrowthRate,
    employees: 0, // Would need historical data
    efficiency: performance.roi
  }
}

function computeRecommendations(
  metrics: AnalyticsMetrics | null,
  costs: EmployeeCostAnalysis | null,
  performance: PerformanceMetrics | null
): string[] {
  const recommendations: string[] = []
  
  if (!metrics || !costs || !performance) {
    return ['Please ensure all analytics data is loaded to receive recommendations']
  }
  
  // Payroll recommendations
  if (metrics.payrollGrowthRate > 20) {
    recommendations.push('Consider implementing salary caps to control payroll growth')
  }
  
  if (metrics.pendingPayments > metrics.completedPayments * 0.1) {
    recommendations.push('High number of pending payments - review payment processing efficiency')
  }
  
  // Cost optimization recommendations
  if (costs.insights.costOptimizationSuggestions.length > 0) {
    recommendations.push(...costs.insights.costOptimizationSuggestions.slice(0, 2))
  }
  
  // Performance recommendations
  if (performance.successRate < 95) {
    recommendations.push('Transaction success rate is below optimal - investigate system issues')
  }
  
  if (performance.gasEfficiency < 80) {
    recommendations.push('Gas efficiency is low - consider optimizing smart contract interactions')
  }
  
  // Token usage recommendations
  if (metrics.tokenUsage.length > 5) {
    recommendations.push('Consider consolidating payment tokens to reduce complexity')
  }
  
  // Employee recommendations
  if (metrics.totalEmployees > 0 && metrics.activeEmployees / metrics.totalEmployees < 0.9) {
    recommendations.push('High inactive employee ratio - review employee status management')
  }
  
  return recommendations.slice(0, 5) // Limit to top 5 recommendations
}
