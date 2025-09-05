import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAccount } from 'wagmi'

interface CompanyData {
  _id: string
  name: string
  ensDomain: string
  ensNode: string
  ownerWallet: string
}

interface AuthState {
  isConnected: boolean
  address: string | undefined
  hasCompany: boolean
  company: CompanyData | null
  loading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  refreshStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isConnected, address, isConnecting } = useAccount()
  const [authState, setAuthState] = useState<Omit<AuthState, 'isConnected' | 'address'>>({
    hasCompany: false,
    company: null,
    loading: false,
    error: null
  })

  const checkCompanyStatus = async (walletAddress: string): Promise<{ hasCompany: boolean; company: CompanyData | null }> => {
    try {
      console.log('🔐 AuthContext: Checking company status for:', walletAddress)
      
      // Force the correct URL construction
      const envUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001'
      const baseUrl = envUrl + '/api'
      const fullUrl = `${baseUrl}/companies/status`
      console.log('🔧 AuthContext: ENV URL:', envUrl)
      console.log('🔧 AuthContext: BASE URL:', baseUrl)
      console.log('🔧 AuthContext: FULL URL:', fullUrl)
      console.log('🔧 AuthContext: Making request to:', fullUrl)
      const response = await fetch(fullUrl, {
        headers: {
          'x-wallet-address': walletAddress
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔐 AuthContext: API response:', data)
        return {
          hasCompany: data.hasCompany,
          company: data.company || null
        }
      } else {
        console.log('🔐 AuthContext: API error:', response.status)
        return { hasCompany: false, company: null }
      }
    } catch (error) {
      console.error('🔐 AuthContext: Network error:', error)
      return { hasCompany: false, company: null }
    }
  }

  const refreshStatus = async () => {
    if (!isConnected || !address) {
      setAuthState({ hasCompany: false, company: null, loading: false, error: null })
      return
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { hasCompany, company } = await checkCompanyStatus(address)
      setAuthState({ hasCompany, company, loading: false, error: null })
    } catch (error) {
      setAuthState({ hasCompany: false, company: null, loading: false, error: 'Failed to check status' })
    }
  }

  // Check status when wallet connection changes
  useEffect(() => {
    if (!isConnecting) {
      refreshStatus()
    }
  }, [isConnected, address, isConnecting])

  const contextValue: AuthContextType = {
    isConnected,
    address,
    hasCompany: authState.hasCompany,
    company: authState.company,
    loading: authState.loading || isConnecting,
    error: authState.error,
    refreshStatus
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
