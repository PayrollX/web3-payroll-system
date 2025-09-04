/**
 * API service for Web3 Payroll System
 * Handles all backend API communications
 * @author Dev Austin
 */

import { API_ENDPOINTS, ERROR_MESSAGES } from '../contracts/constants'

export interface EmployeeData {
  _id?: string
  personalInfo: {
    name: string
    email: string
    phone?: string
    address?: {
      street?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
    }
  }
  employmentDetails: {
    startDate: string
    position: string
    department: string
    employmentType: 'full-time' | 'part-time' | 'contractor'
    isActive: boolean
  }
  payrollSettings: {
    walletAddress: string
    salaryAmount: string
    paymentFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'
    preferredToken: string
    lastPaymentTimestamp: number
  }
  ensDetails: {
    subdomain: string
    fullDomain: string
    ensNode: string
    resolverAddress?: string
  }
  taxInformation: {
    taxId?: string
    withholdings: number
    jurisdiction?: string
    taxExempt: boolean
  }
  blockchainInfo?: {
    contractAddress?: string
    transactionHash?: string
    blockNumber?: number
    gasUsed?: number
  }
  createdAt?: string
  updatedAt?: string
}

export interface PaymentRecord {
  _id: string
  employeeId: string
  amount: string
  tokenAddress: string
  tokenSymbol: string
  transactionHash: string
  blockNumber: number
  paymentDate: string
  paymentType: 'salary' | 'bonus'
  status: 'pending' | 'completed' | 'failed'
  gasUsed: number
  createdAt: string
}

export interface BonusRecord {
  _id: string
  employeeId: string
  amount: string
  tokenAddress: string
  tokenSymbol: string
  reason: string
  transactionHash?: string
  blockNumber?: number
  distributionDate?: string
  status: 'pending' | 'distributed' | 'failed'
  createdAt: string
}

export interface AnalyticsData {
  totalEmployees: number
  activeEmployees: number
  totalPayrollAmount: string
  monthlyPayrollAmount: string
  pendingPayments: number
  completedPayments: number
  totalBonuses: string
  monthlyBonuses: string
  departmentBreakdown: {
    department: string
    employeeCount: number
    totalSalary: string
  }[]
  paymentTrends: {
    month: string
    amount: string
    count: number
  }[]
  tokenUsage: {
    token: string
    symbol: string
    amount: string
    percentage: number
  }[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  totalPages: number
  currentPage: number
  total: number
}

export interface EmployeesResponse {
  employees: EmployeeData[]
  totalPages: number
  currentPage: number
  total: number
}

/**
 * API service class for backend communications
 */
export class ApiService {
  private baseURL: string
  private authToken: string | null = null

  constructor() {
    this.baseURL = API_ENDPOINTS.BASE_URL
    this.loadAuthToken()
  }

  /**
   * Load authentication token from localStorage
   */
  private loadAuthToken(): void {
    this.authToken = localStorage.getItem('auth_token')
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token
    localStorage.setItem('auth_token', token)
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): void {
    this.authToken = null
    localStorage.removeItem('auth_token')
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    return headers
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || ERROR_MESSAGES.NETWORK_ERROR,
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error: any) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error.message || ERROR_MESSAGES.NETWORK_ERROR,
      }
    }
  }

  // Employee Management API

  /**
   * Get all employees
   */
  async getEmployees(params?: {
    department?: string
    active?: boolean
    page?: number
    limit?: number
  }): Promise<ApiResponse<EmployeesResponse>> {
    const queryParams = new URLSearchParams()
    
    if (params?.department) queryParams.append('department', params.department)
    if (params?.active !== undefined) queryParams.append('active', params.active.toString())
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `${API_ENDPOINTS.EMPLOYEES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<EmployeesResponse>(endpoint)
  }

  /**
   * Get employee by ID
   */
  async getEmployee(id: string): Promise<ApiResponse<EmployeeData>> {
    return this.request<EmployeeData>(`${API_ENDPOINTS.EMPLOYEES}/${id}`)
  }

  /**
   * Create new employee
   */
  async createEmployee(employeeData: Partial<EmployeeData>): Promise<ApiResponse<EmployeeData>> {
    return this.request<EmployeeData>(API_ENDPOINTS.EMPLOYEES, {
      method: 'POST',
      body: JSON.stringify(employeeData),
    })
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, employeeData: Partial<EmployeeData>): Promise<ApiResponse<EmployeeData>> {
    return this.request<EmployeeData>(`${API_ENDPOINTS.EMPLOYEES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    })
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${API_ENDPOINTS.EMPLOYEES}/${id}`, {
      method: 'DELETE',
    })
  }

  /**
   * Activate employee
   */
  async activateEmployee(id: string): Promise<ApiResponse<EmployeeData>> {
    return this.request<EmployeeData>(`${API_ENDPOINTS.EMPLOYEES}/${id}/activate`, {
      method: 'POST',
    })
  }

  /**
   * Deactivate employee
   */
  async deactivateEmployee(id: string): Promise<ApiResponse<EmployeeData>> {
    return this.request<EmployeeData>(`${API_ENDPOINTS.EMPLOYEES}/${id}/deactivate`, {
      method: 'POST',
    })
  }

  // Payroll API

  /**
   * Get payment history
   */
  async getPaymentHistory(params?: {
    employeeId?: string
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<PaginatedResponse<PaymentRecord>>> {
    const queryParams = new URLSearchParams()
    
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const endpoint = `${API_ENDPOINTS.PAYROLL}/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<PaginatedResponse<PaymentRecord>>(endpoint)
  }

  /**
   * Get pending payments
   */
  async getPendingPayments(): Promise<ApiResponse<PaymentRecord[]>> {
    return this.request<PaymentRecord[]>(`${API_ENDPOINTS.PAYROLL}/pending`)
  }

  /**
   * Process payroll
   */
  async processPayroll(employeeIds: string[]): Promise<ApiResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>(`${API_ENDPOINTS.PAYROLL}/process`, {
      method: 'POST',
      body: JSON.stringify({ employeeIds }),
    })
  }

  /**
   * Process individual payment
   */
  async processIndividualPayment(employeeId: string): Promise<ApiResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>(`${API_ENDPOINTS.PAYROLL}/process/${employeeId}`, {
      method: 'POST',
    })
  }

  // Bonus API

  /**
   * Get all bonuses
   */
  async getBonuses(params?: {
    employeeId?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<BonusRecord>>> {
    const queryParams = new URLSearchParams()
    
    if (params?.employeeId) queryParams.append('employeeId', params.employeeId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const endpoint = `${API_ENDPOINTS.BONUSES}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<PaginatedResponse<BonusRecord>>(endpoint)
  }

  /**
   * Create bonus
   */
  async createBonus(bonusData: {
    employeeId: string
    amount: string
    tokenAddress: string
    reason: string
  }): Promise<ApiResponse<BonusRecord>> {
    return this.request<BonusRecord>(API_ENDPOINTS.BONUSES, {
      method: 'POST',
      body: JSON.stringify(bonusData),
    })
  }

  /**
   * Distribute bonus
   */
  async distributeBonus(bonusId: string): Promise<ApiResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>(`${API_ENDPOINTS.BONUSES}/${bonusId}/distribute`, {
      method: 'POST',
    })
  }

  /**
   * Bulk bonus distribution
   */
  async bulkBonusDistribution(bonusIds: string[]): Promise<ApiResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>(`${API_ENDPOINTS.BONUSES}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ bonusIds }),
    })
  }

  // ENS API

  /**
   * Get company domains
   */
  async getCompanyDomains(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`${API_ENDPOINTS.ENS}/company-domains`)
  }

  /**
   * Register ENS subdomain
   */
  async registerENSSubdomain(data: {
    subdomain: string
    employeeAddress: string
    resolverAddress?: string
  }): Promise<ApiResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>(`${API_ENDPOINTS.ENS}/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Resolve ENS name
   */
  async resolveENS(ensName: string): Promise<ApiResponse<{ address: string }>> {
    return this.request<{ address: string }>(`${API_ENDPOINTS.ENS}/resolve/${ensName}`)
  }

  /**
   * Transfer ENS subdomain
   */
  async transferENSSubdomain(data: {
    subdomain: string
    newOwner: string
  }): Promise<ApiResponse<{ transactionHash: string }>> {
    return this.request<{ transactionHash: string }>(`${API_ENDPOINTS.ENS}/transfer`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Analytics API

  /**
   * Get payroll summary analytics
   */
  async getPayrollSummary(): Promise<ApiResponse<AnalyticsData>> {
    return this.request<AnalyticsData>(`${API_ENDPOINTS.ANALYTICS}/payroll-summary`)
  }

  /**
   * Get employee cost analysis
   */
  async getEmployeeCosts(): Promise<ApiResponse<any>> {
    return this.request<any>(`${API_ENDPOINTS.ANALYTICS}/employee-costs`)
  }

  /**
   * Get payment trends
   */
  async getPaymentTrends(params?: {
    startDate?: string
    endDate?: string
    period?: 'daily' | 'weekly' | 'monthly'
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.period) queryParams.append('period', params.period)

    const endpoint = `${API_ENDPOINTS.ANALYTICS}/payment-trends${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<any>(endpoint)
  }

  // Authentication API

  /**
   * Authenticate with wallet signature
   */
  async authenticateWithWallet(data: {
    address: string
    signature: string
    message: string
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request<{ token: string; user: any }>(`${API_ENDPOINTS.AUTH}/wallet`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request<{ token: string }>(`${API_ENDPOINTS.AUTH}/refresh`, {
      method: 'POST',
    })
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    const result = await this.request<void>(`${API_ENDPOINTS.AUTH}/logout`, {
      method: 'POST',
    })
    
    if (result.success) {
      this.clearAuthToken()
    }
    
    return result
  }

  // Utility methods

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.authToken
  }

  /**
   * Get current user info from token
   */
  getCurrentUser(): any {
    if (!this.authToken) return null
    
    try {
      const payload = JSON.parse(atob(this.authToken.split('.')[1]))
      return payload
    } catch (error) {
      console.error('Error parsing auth token:', error)
      return null
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

