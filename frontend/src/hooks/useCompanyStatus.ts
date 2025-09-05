import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { getCachedCompanyStatus, setCachedCompanyStatus } from '../utils/routeUtils'

interface CompanyStatus {
  hasCompany: boolean
  company: any | null
  loading: boolean
  error: string | null
}

/**
 * Simple hook to check if connected wallet has a registered company
 * Replaces the complex useOnboarding hook for Web3-native approach
 */
export const useCompanyStatus = (): CompanyStatus => {
  const { isConnected, address } = useAccount()
  const [status, setStatus] = useState<CompanyStatus>({
    hasCompany: false,
    company: null,
    loading: false,
    error: null
  })

  useEffect(() => {
    const checkCompanyStatus = async () => {
      if (!isConnected || !address) {
        console.log('🔍 useCompanyStatus: Not connected or no address, setting hasCompany: false')
        setStatus({ hasCompany: false, company: null, loading: false, error: null })
        return
      }

      // Check cache first to prevent rapid API calls
      const cachedStatus = getCachedCompanyStatus(address)
      if (cachedStatus !== null) {
        setStatus({
          hasCompany: cachedStatus,
          company: null, // We don't cache the full company object
          loading: false,
          error: null
        })
        return
      }

      console.log('🔍 useCompanyStatus: Checking status for wallet:', address)
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      try {
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001'
        const response = await fetch(`${baseUrl}/api/companies/status`, {
          headers: {
            'x-wallet-address': address
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('🔍 useCompanyStatus: API Response:', data)
          
          // Cache the result
          setCachedCompanyStatus(address, data.hasCompany)
          
          setStatus({
            hasCompany: data.hasCompany,
            company: data.company,
            loading: false,
            error: null
          })
        } else {
          console.log('🔍 useCompanyStatus: API Error Response:', response.status)
          setStatus({
            hasCompany: false,
            company: null,
            loading: false,
            error: 'Failed to check company status'
          })
        }
      } catch (error) {
        console.log('🔍 useCompanyStatus: Network Error:', error)
        setStatus({
          hasCompany: false,
          company: null,
          loading: false,
          error: 'Network error'
        })
      }
    }

    // Add a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(checkCompanyStatus, 100)
    
    return () => clearTimeout(timeoutId)
  }, [isConnected, address])

  return status
}

export default useCompanyStatus
