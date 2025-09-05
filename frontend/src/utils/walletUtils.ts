/**
 * Wallet utility functions
 * @author Dev Austin
 */

/**
 * Clear all wallet-related localStorage data
 * This forces the wallet selection modal to show
 */
export const clearWalletCache = () => {
  try {
    // Clear wagmi store
    localStorage.removeItem('wagmi.store')
    localStorage.removeItem('wagmi.wallet')
    
    // Clear RainbowKit cache
    localStorage.removeItem('rainbowkit.wallet')
    localStorage.removeItem('rainbowkit.recentConnectorId')
    
    // Clear any other wallet-related cache
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (
        key.includes('wagmi') ||
        key.includes('rainbow') ||
        key.includes('wallet') ||
        key.includes('connector')
      )) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    
    console.log('🧹 Wallet cache cleared successfully')
    return true
  } catch (error) {
    console.error('❌ Error clearing wallet cache:', error)
    return false
  }
}

/**
 * Get current wallet connection info
 */
export const getWalletInfo = () => {
  try {
    const wagmiStore = localStorage.getItem('wagmi.store')
    if (wagmiStore) {
      const parsed = JSON.parse(wagmiStore)
      return {
        connected: parsed?.state?.connections?.size > 0,
        address: parsed?.state?.connections?.values()?.next()?.value?.accounts?.[0],
        connector: parsed?.state?.connections?.values()?.next()?.value?.connector?.name
      }
    }
    return { connected: false, address: null, connector: null }
  } catch (error) {
    console.error('Error getting wallet info:', error)
    return { connected: false, address: null, connector: null }
  }
}

/**
 * Force wallet disconnection
 */
export const forceDisconnect = () => {
  clearWalletCache()
  // Reload the page to reset all wallet state
  window.location.reload()
}
