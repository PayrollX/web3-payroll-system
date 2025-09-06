/**
 * Utility functions to prevent redirect loops and manage routing safely
 */

// Simple cache to prevent rapid consecutive API calls
const statusCache = new Map<string, { hasCompany: boolean; timestamp: number }>()
const CACHE_DURATION = 5000 // 5 seconds

export const getCachedCompanyStatus = (walletAddress: string): boolean | null => {
  const cached = statusCache.get(walletAddress.toLowerCase())
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('🎯 Using cached company status for:', walletAddress, 'hasCompany:', cached.hasCompany)
    return cached.hasCompany
  }
  return null
}

export const setCachedCompanyStatus = (walletAddress: string, hasCompany: boolean): void => {
  statusCache.set(walletAddress.toLowerCase(), {
    hasCompany,
    timestamp: Date.now()
  })
  console.log('💾 Cached company status for:', walletAddress, 'hasCompany:', hasCompany)
}

export const clearCompanyStatusCache = (): void => {
  statusCache.clear()
  console.log('🗑️ Cleared company status cache')
}



