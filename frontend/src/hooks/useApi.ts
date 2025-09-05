/**
 * Custom hooks for API interactions
 * @author Dev Austin
 */

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { 
  apiService, 
  EmployeeData, 
  PaymentRecord, 
  BonusRecord, 
  AnalyticsData,
  PaginatedResponse,
  EmployeesResponse 
} from '../services/apiService'

export interface UseEmployeesReturn {
  employees: EmployeeData[]
  totalEmployees: number
  activeEmployees: number
  loading: boolean
  error: string | null
  createEmployee: (data: Partial<EmployeeData>) => Promise<boolean>
  updateEmployee: (id: string, data: Partial<EmployeeData>) => Promise<boolean>
  deleteEmployee: (id: string) => Promise<boolean>
  activateEmployee: (id: string) => Promise<boolean>
  deactivateEmployee: (id: string) => Promise<boolean>
  refreshEmployees: () => Promise<void>
}

export interface UsePaymentsReturn {
  payments: PaymentRecord[]
  pendingPayments: PaymentRecord[]
  loading: boolean
  error: string | null
  processPayroll: (employeeIds: string[]) => Promise<boolean>
  processIndividualPayment: (employeeId: string) => Promise<boolean>
  refreshPayments: () => Promise<void>
}

export interface UseBonusesReturn {
  bonuses: BonusRecord[]
  loading: boolean
  error: string | null
  createBonus: (data: any) => Promise<boolean>
  distributeBonus: (bonusId: string) => Promise<boolean>
  bulkDistributeBonuses: (bonusIds: string[]) => Promise<boolean>
  refreshBonuses: () => Promise<void>
}

export interface UseAnalyticsReturn {
  analytics: AnalyticsData | null
  loading: boolean
  error: string | null
  refreshAnalytics: () => Promise<void>
}

/**
 * Hook for employee management
 */
export const useEmployees = (params?: {
  department?: string
  active?: boolean
  page?: number
  limit?: number
}): UseEmployeesReturn => {
  const { address } = useAccount()
  const [employees, setEmployees] = useState<EmployeeData[]>([])
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [activeEmployees, setActiveEmployees] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set wallet address in API service when address changes
  useEffect(() => {
    if (address) {
      apiService.setWalletAddress(address)
    }
  }, [address])

  const loadEmployees = useCallback(async () => {
    if (!address) {
      console.log('🔐 useEmployees: No wallet address available, skipping load')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔐 useEmployees: Loading employees for wallet:', address)
      const response = await apiService.getEmployees(params)
      
      if (response.success && response.data) {
        // The response format is EmployeesResponse with 'employees' property
        const employeeArray = response.data.employees || []
        
        setEmployees(employeeArray)
        setTotalEmployees(response.data.total || employeeArray.length)
        
        // Count active employees safely
        const activeCount = employeeArray.filter(emp => emp?.employmentDetails?.isActive).length
        setActiveEmployees(activeCount)
      } else {
        console.warn('API response:', response)
        setError(response.error || 'Failed to load employees')
        // Set empty arrays as fallback
        setEmployees([])
        setTotalEmployees(0)
        setActiveEmployees(0)
      }
    } catch (err: any) {
      console.error('Error loading employees:', err)
      setError(err.message || 'Failed to load employees')
      // Set empty arrays as fallback
      setEmployees([])
      setTotalEmployees(0)
      setActiveEmployees(0)
    } finally {
      setLoading(false)
    }
  }, [params])

  const createEmployee = useCallback(async (data: Partial<EmployeeData>): Promise<boolean> => {
    try {
      const response = await apiService.createEmployee(data)
      
      if (response.success) {
        await loadEmployees() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to create employee')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create employee')
      return false
    }
  }, [loadEmployees])

  const updateEmployee = useCallback(async (id: string, data: Partial<EmployeeData>): Promise<boolean> => {
    try {
      const response = await apiService.updateEmployee(id, data)
      
      if (response.success) {
        await loadEmployees() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to update employee')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update employee')
      return false
    }
  }, [loadEmployees])

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deleteEmployee(id)
      
      if (response.success) {
        await loadEmployees() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to delete employee')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee')
      return false
    }
  }, [loadEmployees])

  const activateEmployee = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.activateEmployee(id)
      
      if (response.success) {
        await loadEmployees() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to activate employee')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to activate employee')
      return false
    }
  }, [loadEmployees])

  const deactivateEmployee = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await apiService.deactivateEmployee(id)
      
      if (response.success) {
        await loadEmployees() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to deactivate employee')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate employee')
      return false
    }
  }, [loadEmployees])

  const refreshEmployees = useCallback(async () => {
    await loadEmployees()
  }, [loadEmployees])

  // Load employees on mount and when params change
  useEffect(() => {
    if (address) {
      loadEmployees()
    }
  }, [loadEmployees, address])

  return {
    employees,
    totalEmployees,
    activeEmployees,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    activateEmployee,
    deactivateEmployee,
    refreshEmployees,
  }
}

/**
 * Hook for payment management
 */
export const usePayments = (params?: {
  employeeId?: string
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
}): UsePaymentsReturn => {
  const { address } = useAccount()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set wallet address in API service when address changes
  useEffect(() => {
    if (address) {
      apiService.setWalletAddress(address)
    }
  }, [address])

  const loadPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [historyResponse, pendingResponse] = await Promise.all([
        apiService.getPaymentHistory(params),
        apiService.getPendingPayments()
      ])
      
      if (historyResponse.success && historyResponse.data) {
        setPayments(historyResponse.data.data)
      } else {
        setError(historyResponse.error || 'Failed to load payment history')
      }
      
      if (pendingResponse.success && pendingResponse.data) {
        setPendingPayments(pendingResponse.data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments')
    } finally {
      setLoading(false)
    }
  }, [params])

  const processPayroll = useCallback(async (employeeIds: string[]): Promise<boolean> => {
    try {
      const response = await apiService.processPayroll(employeeIds)
      
      if (response.success) {
        await loadPayments() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to process payroll')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payroll')
      return false
    }
  }, [loadPayments])

  const processIndividualPayment = useCallback(async (employeeId: string): Promise<boolean> => {
    try {
      const response = await apiService.processIndividualPayment(employeeId)
      
      if (response.success) {
        await loadPayments() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to process individual payment')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process individual payment')
      return false
    }
  }, [loadPayments])

  const refreshPayments = useCallback(async () => {
    await loadPayments()
  }, [loadPayments])

  // Load payments on mount and when params change
  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  return {
    payments,
    pendingPayments,
    loading,
    error,
    processPayroll,
    processIndividualPayment,
    refreshPayments,
  }
}

/**
 * Hook for bonus management
 */
export const useBonuses = (params?: {
  employeeId?: string
  status?: string
  page?: number
  limit?: number
}): UseBonusesReturn => {
  const { address } = useAccount()
  const [bonuses, setBonuses] = useState<BonusRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set wallet address in API service when address changes
  useEffect(() => {
    if (address) {
      apiService.setWalletAddress(address)
    }
  }, [address])

  const loadBonuses = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiService.getBonuses(params)
      
      if (response.success && response.data) {
        setBonuses(response.data.data)
      } else {
        setError(response.error || 'Failed to load bonuses')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bonuses')
    } finally {
      setLoading(false)
    }
  }, [params])

  const createBonus = useCallback(async (data: any): Promise<boolean> => {
    try {
      const response = await apiService.createBonus(data)
      
      if (response.success) {
        await loadBonuses() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to create bonus')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create bonus')
      return false
    }
  }, [loadBonuses])

  const distributeBonus = useCallback(async (bonusId: string): Promise<boolean> => {
    try {
      const response = await apiService.distributeBonus(bonusId)
      
      if (response.success) {
        await loadBonuses() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to distribute bonus')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to distribute bonus')
      return false
    }
  }, [loadBonuses])

  const bulkDistributeBonuses = useCallback(async (bonusIds: string[]): Promise<boolean> => {
    try {
      const response = await apiService.bulkBonusDistribution(bonusIds)
      
      if (response.success) {
        await loadBonuses() // Refresh the list
        return true
      } else {
        setError(response.error || 'Failed to distribute bonuses')
        return false
      }
    } catch (err: any) {
      setError(err.message || 'Failed to distribute bonuses')
      return false
    }
  }, [loadBonuses])

  const refreshBonuses = useCallback(async () => {
    await loadBonuses()
  }, [loadBonuses])

  // Load bonuses on mount and when params change
  useEffect(() => {
    loadBonuses()
  }, [loadBonuses])

  return {
    bonuses,
    loading,
    error,
    createBonus,
    distributeBonus,
    bulkDistributeBonuses,
    refreshBonuses,
  }
}

/**
 * Hook for analytics data
 */
export const useAnalytics = (): UseAnalyticsReturn => {
  const { address } = useAccount()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Set wallet address in API service when address changes
  useEffect(() => {
    if (address) {
      apiService.setWalletAddress(address)
    }
  }, [address])

  const loadAnalytics = useCallback(async () => {
    if (!address) {
      console.log('🔐 useAnalytics: No wallet address available, skipping load')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🔐 useAnalytics: Loading analytics for wallet:', address)
      const response = await apiService.getPayrollSummary()
      
      if (response.success && response.data) {
        setAnalytics(response.data)
      } else {
        setError(response.error || 'Failed to load analytics')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAnalytics = useCallback(async () => {
    await loadAnalytics()
  }, [loadAnalytics])

  // Load analytics on mount
  useEffect(() => {
    if (address) {
      loadAnalytics()
    }
  }, [loadAnalytics, address])

  return {
    analytics,
    loading,
    error,
    refreshAnalytics,
  }
}

/**
 * Hook for authentication
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(apiService.isAuthenticated())
  const [user, setUser] = useState(apiService.getCurrentUser())

  const authenticateWithWallet = useCallback(async (data: {
    address: string
    signature: string
    message: string
  }) => {
    try {
      const response = await apiService.authenticateWithWallet(data)
      
      if (response.success && response.data) {
        apiService.setAuthToken(response.data.token)
        setIsAuthenticated(true)
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Authentication failed:', error)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiService.logout()
      setIsAuthenticated(false)
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  return {
    isAuthenticated,
    user,
    authenticateWithWallet,
    logout,
  }
}

