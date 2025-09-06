/**
 * Analytics Service for Web3 Payroll System
 * Provides enhanced analytics data processing and calculations
 * @author Dev Austin
 */

import { apiService } from './apiService'

// Define employee interface for analytics
interface AnalyticsEmployee {
  employeeId?: string
  name: string
  position?: string
  department: string
  monthlyCost?: string
  annualCost: string
  paymentFrequency?: string
  preferredToken?: string
  ensName?: string
  ensDomain?: string
  [key: string]: any
}

export interface AnalyticsMetrics {
  // Employee metrics
  totalEmployees: number
  activeEmployees: number
  newHiresThisMonth: number
  turnoverRate: number
  
  // Financial metrics
  totalPayrollAmount: string
  monthlyPayrollAmount: string
  averageSalary: string
  medianSalary: string
  payrollGrowthRate: number
  
  // Payment metrics
  totalPayments: number
  pendingPayments: number
  completedPayments: number
  failedPayments: number
  averagePaymentAmount: string
  
  // Bonus metrics
  totalBonuses: string
  monthlyBonuses: string
  averageBonusAmount: string
  bonusDistributionRate: number
  
  // Token metrics
  tokenUsage: Array<{
    token: string
    symbol: string
    amount: string
    percentage: number
    transactionCount: number
  }>
  
  // Department metrics
  departmentBreakdown: Array<{
    department: string
    employeeCount: number
    totalSalary: string
    averageSalary: string
    percentage: number
  }>
  
  // Time-based metrics
  paymentTrends: Array<{
    period: string
    date: string
    totalAmount: string
    paymentCount: number
    averagePayment: string
    ethAmount: string
    tokenAmount: string
  }>
}

export interface EmployeeCostAnalysis {
  employees: Array<{
    employeeId: string
    name: string
    position: string
    department: string
    monthlyCost: string
    annualCost: string
    paymentFrequency: string
    preferredToken: string
    ensName: string
    ensDomain: string
    costPerHour?: string
    efficiency?: number
  }>
  totals: {
    totalMonthlyCost: string
    totalAnnualCost: string
    averageMonthlyCost: string
    averageAnnualCost: string
    medianAnnualCost: string
    costVariance: number
  }
  insights: {
    highestPaidEmployee: string
    lowestPaidEmployee: string
    mostExpensiveDepartment: string
    costOptimizationSuggestions: string[]
  }
}

export interface PerformanceMetrics {
  // System performance
  averageTransactionTime: number
  successRate: number
  gasEfficiency: number
  
  // User engagement
  activeUsers: number
  averageSessionDuration: number
  featureUsage: Record<string, number>
  
  // Business metrics
  revenueGrowth: number
  costReduction: number
  roi: number
}

/**
 * Enhanced Analytics Service
 */
export class AnalyticsService {
  /**
   * Get comprehensive analytics metrics
   */
  async getComprehensiveMetrics(): Promise<AnalyticsMetrics | null> {
    try {
      const [payrollSummary, employeeCosts, paymentTrends] = await Promise.all([
        apiService.getPayrollSummary(),
        apiService.getEmployeeCosts(),
        apiService.getPaymentTrends({ period: 'monthly' })
      ])

      if (!payrollSummary.success || !payrollSummary.data) {
        return null
      }

      const data = payrollSummary.data
      const costs = employeeCosts.success ? employeeCosts.data : null
      const trends = paymentTrends.success ? paymentTrends.data : null

      // Calculate additional metrics
      const averageSalary = costs?.totals?.averageAnnualCost 
        ? (parseFloat(costs.totals.averageAnnualCost) / 12).toFixed(4)
        : '0.0000'

      const medianSalary = this.calculateMedianSalary(costs?.employees || [])
      
      const payrollGrowthRate = this.calculateGrowthRate(trends?.trends || [])
      
      const bonusDistributionRate = this.calculateBonusDistributionRate(data)

      return {
        // Employee metrics
        totalEmployees: data.totalEmployees,
        activeEmployees: data.activeEmployees,
        newHiresThisMonth: 0, // Would need additional data
        turnoverRate: 0, // Would need historical data
        
        // Financial metrics
        totalPayrollAmount: data.totalPayrollAmount,
        monthlyPayrollAmount: data.monthlyPayrollAmount,
        averageSalary,
        medianSalary,
        payrollGrowthRate,
        
        // Payment metrics
        totalPayments: data.completedPayments + data.pendingPayments,
        pendingPayments: data.pendingPayments,
        completedPayments: data.completedPayments,
        failedPayments: 0, // Would need additional data
        averagePaymentAmount: averageSalary,
        
        // Bonus metrics
        totalBonuses: data.totalBonuses,
        monthlyBonuses: data.monthlyBonuses,
        averageBonusAmount: this.calculateAverageBonus(data),
        bonusDistributionRate,
        
        // Token metrics
        tokenUsage: data.tokenUsage.map(token => ({
          ...token,
          transactionCount: Math.floor(parseFloat(token.amount) / parseFloat(averageSalary))
        })),
        
        // Department metrics
        departmentBreakdown: data.departmentBreakdown.map(dept => ({
          ...dept,
          averageSalary: (parseFloat(dept.totalSalary) / dept.employeeCount).toFixed(4),
          percentage: parseFloat(((dept.employeeCount / data.totalEmployees) * 100).toFixed(1))
        })),
        
        // Time-based metrics
        paymentTrends: trends?.trends || []
      }
    } catch (error) {
      console.error('Failed to get comprehensive metrics:', error)
      return null
    }
  }

  /**
   * Get enhanced employee cost analysis
   */
  async getEnhancedEmployeeCosts(): Promise<EmployeeCostAnalysis | null> {
    try {
      const response = await apiService.getEmployeeCosts()
      
      if (!response.success || !response.data) {
        return null
      }

      const data = response.data
      const employees: AnalyticsEmployee[] = data.employees || []
      
      // Calculate additional metrics
      const medianAnnualCost = this.calculateMedian(employees.map((emp: AnalyticsEmployee) => parseFloat(emp.annualCost)))
      const costVariance = this.calculateVariance(employees.map((emp: AnalyticsEmployee) => parseFloat(emp.annualCost)))
      
      // Find insights
      const sortedByCost = [...employees].sort((a: AnalyticsEmployee, b: AnalyticsEmployee) => parseFloat(b.annualCost) - parseFloat(a.annualCost))
      const highestPaid = sortedByCost[0]?.name || 'N/A'
      const lowestPaid = sortedByCost[sortedByCost.length - 1]?.name || 'N/A'
      
      // Find most expensive department
      const deptCosts = employees.reduce((acc: Record<string, number>, emp: AnalyticsEmployee) => {
        acc[emp.department] = (acc[emp.department] || 0) + parseFloat(emp.annualCost)
        return acc
      }, {})
      const mostExpensiveDept = Object.entries(deptCosts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'N/A'

      // Generate cost optimization suggestions
      const suggestions = this.generateCostOptimizationSuggestions(employees, data.totals)

      return {
        employees: employees.map((emp: AnalyticsEmployee) => ({
          employeeId: emp.employeeId || `emp_${Math.random().toString(36).substr(2, 9)}`,
          name: emp.name,
          position: emp.position || 'Unknown',
          department: emp.department,
          monthlyCost: emp.monthlyCost || (parseFloat(emp.annualCost) / 12).toFixed(4),
          annualCost: emp.annualCost,
          paymentFrequency: emp.paymentFrequency || 'monthly',
          preferredToken: emp.preferredToken || 'ETH',
          ensName: emp.ensName || emp.name.toLowerCase().replace(/\s+/g, ''),
          ensDomain: emp.ensDomain || `${emp.name.toLowerCase().replace(/\s+/g, '')}.company.eth`,
          costPerHour: this.calculateCostPerHour(emp),
          efficiency: this.calculateEmployeeEfficiency(emp)
        })),
        totals: {
          ...data.totals,
          medianAnnualCost: medianAnnualCost.toFixed(4),
          costVariance
        },
        insights: {
          highestPaidEmployee: highestPaid,
          lowestPaidEmployee: lowestPaid,
          mostExpensiveDepartment: mostExpensiveDept,
          costOptimizationSuggestions: suggestions
        }
      }
    } catch (error) {
      console.error('Failed to get enhanced employee costs:', error)
      return null
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // This would typically come from system monitoring
    // For now, return mock data based on available analytics
    try {
      const payrollSummary = await apiService.getPayrollSummary()
      
      if (!payrollSummary.success || !payrollSummary.data) {
        return this.getDefaultPerformanceMetrics()
      }

      const data = payrollSummary.data
      
      return {
        // System performance (mock data - would come from actual monitoring)
        averageTransactionTime: 2.5, // seconds
        successRate: 98.5, // percentage
        gasEfficiency: 85.2, // percentage
        
        // User engagement (mock data)
        activeUsers: data.totalEmployees,
        averageSessionDuration: 15.5, // minutes
        featureUsage: {
          'payroll': 95,
          'bonuses': 60,
          'analytics': 40,
          'ens': 30
        },
        
        // Business metrics
        revenueGrowth: 12.5, // percentage
        costReduction: 8.3, // percentage
        roi: 245.7 // percentage
      }
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      return this.getDefaultPerformanceMetrics()
    }
  }

  /**
   * Export analytics data to CSV
   */
  async exportAnalyticsData(format: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const metrics = await this.getComprehensiveMetrics()
      const costs = await this.getEnhancedEmployeeCosts()
      const performance = await this.getPerformanceMetrics()

      if (!metrics) {
        throw new Error('No analytics data available')
      }

      if (format === 'json') {
        return JSON.stringify({
          metrics,
          costs,
          performance,
          exportedAt: new Date().toISOString()
        }, null, 2)
      }

      // CSV format
      const csvData = this.convertToCSV(metrics, costs, performance)
      return csvData
    } catch (error) {
      console.error('Failed to export analytics data:', error)
      throw error
    }
  }

  // Private helper methods

  private calculateMedianSalary(employees: any[]): string {
    if (employees.length === 0) return '0.0000'
    
    const salaries = employees
      .map(emp => parseFloat(emp.annualCost))
      .sort((a, b) => a - b)
    
    const mid = Math.floor(salaries.length / 2)
    return salaries.length % 2 === 0
      ? ((salaries[mid - 1] + salaries[mid]) / 2).toFixed(4)
      : salaries[mid].toFixed(4)
  }

  private calculateGrowthRate(trends: any[]): number {
    if (trends.length < 2) return 0
    
    const first = parseFloat(trends[0].totalAmount)
    const last = parseFloat(trends[trends.length - 1].totalAmount)
    
    return first > 0 ? ((last - first) / first) * 100 : 0
  }

  private calculateBonusDistributionRate(data: any): number {
    const totalPayroll = parseFloat(data.totalPayrollAmount)
    const totalBonuses = parseFloat(data.totalBonuses)
    
    return totalPayroll > 0 ? (totalBonuses / totalPayroll) * 100 : 0
  }

  private calculateAverageBonus(data: any): string {
    const totalBonuses = parseFloat(data.totalBonuses)
    const employeeCount = data.totalEmployees
    
    return employeeCount > 0 ? (totalBonuses / employeeCount).toFixed(4) : '0.0000'
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0
    
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid]
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
    
    return Math.sqrt(variance) // Standard deviation
  }

  private calculateCostPerHour(employee: any): string {
    // Assuming 40 hours per week, 52 weeks per year
    const annualHours = 40 * 52
    const annualCost = parseFloat(employee.annualCost)
    
    return (annualCost / annualHours).toFixed(2)
  }

  private calculateEmployeeEfficiency(employee: any): number {
    // Mock efficiency calculation based on salary vs average
    // In a real system, this would be based on performance metrics
    const salary = parseFloat(employee.annualCost)
    const averageSalary = 75000 // Mock average
    
    return Math.min(100, Math.max(50, (averageSalary / salary) * 100))
  }

  private generateCostOptimizationSuggestions(employees: any[], totals: any): string[] {
    const suggestions: string[] = []
    
    // Analyze salary distribution
    const salaries = employees.map(emp => parseFloat(emp.annualCost))
    const maxSalary = Math.max(...salaries)
    const minSalary = Math.min(...salaries)
    const salaryRange = maxSalary - minSalary
    
    if (salaryRange > maxSalary * 0.5) {
      suggestions.push('Consider salary band standardization to reduce pay disparities')
    }
    
    // Check for high-cost employees
    const highCostEmployees = employees.filter(emp => 
      parseFloat(emp.annualCost) > parseFloat(totals.averageAnnualCost) * 1.5
    )
    
    if (highCostEmployees.length > 0) {
      suggestions.push(`Review compensation for ${highCostEmployees.length} high-cost employees`)
    }
    
    // Department analysis
    const deptCosts = employees.reduce((acc: Record<string, number>, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + parseFloat(emp.annualCost)
      return acc
    }, {})
    
    const avgDeptCost = Object.values(deptCosts).reduce((sum, cost) => sum + cost, 0) / Object.keys(deptCosts).length
    
    Object.entries(deptCosts).forEach(([dept, cost]) => {
      if (cost > avgDeptCost * 1.3) {
        suggestions.push(`Optimize costs in ${dept} department (${((cost / avgDeptCost - 1) * 100).toFixed(1)}% above average)`)
      }
    })
    
    return suggestions
  }

  private convertToCSV(metrics: AnalyticsMetrics, costs: EmployeeCostAnalysis | null, performance: PerformanceMetrics): string {
    const headers = [
      'Metric Category',
      'Metric Name',
      'Value',
      'Unit',
      'Timestamp'
    ]
    
    const rows: string[][] = [headers]
    const timestamp = new Date().toISOString()
    
    // Add metrics data
    rows.push(['Employee', 'Total Employees', metrics.totalEmployees.toString(), 'count', timestamp])
    rows.push(['Employee', 'Active Employees', metrics.activeEmployees.toString(), 'count', timestamp])
    rows.push(['Financial', 'Total Payroll', metrics.totalPayrollAmount, 'ETH', timestamp])
    rows.push(['Financial', 'Monthly Payroll', metrics.monthlyPayrollAmount, 'ETH', timestamp])
    rows.push(['Financial', 'Average Salary', metrics.averageSalary, 'ETH', timestamp])
    rows.push(['Payment', 'Total Payments', metrics.totalPayments.toString(), 'count', timestamp])
    rows.push(['Payment', 'Completed Payments', metrics.completedPayments.toString(), 'count', timestamp])
    rows.push(['Bonus', 'Total Bonuses', metrics.totalBonuses, 'ETH', timestamp])
    rows.push(['Performance', 'Success Rate', performance.successRate.toString(), '%', timestamp])
    rows.push(['Performance', 'ROI', performance.roi.toString(), '%', timestamp])
    
    // Convert to CSV string
    return rows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n')
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      averageTransactionTime: 0,
      successRate: 0,
      gasEfficiency: 0,
      activeUsers: 0,
      averageSessionDuration: 0,
      featureUsage: {},
      revenueGrowth: 0,
      costReduction: 0,
      roi: 0
    }
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService()
