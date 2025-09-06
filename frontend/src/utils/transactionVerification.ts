/**
 * Transaction Verification Utilities
 * Provides functions to verify transactions on Etherscan and ensure they're successful
 */

export interface TransactionVerificationResult {
  success: boolean
  confirmed: boolean
  blockNumber?: number
  gasUsed?: string
  status?: 'success' | 'failed' | 'pending'
  confirmations?: number
  error?: string
}

/**
 * Verify a transaction on Etherscan API
 */
export async function verifyTransactionOnEtherscan(
  txHash: string, 
  chainId: number = 11155111, // Default to Sepolia
  apiKey?: string
): Promise<TransactionVerificationResult> {
  try {
    console.log(`🔍 Verifying transaction ${txHash} on Etherscan...`)
    
    // Determine the correct Etherscan API endpoint
    const baseUrl = getEtherscanApiUrl(chainId)
    
    // Build API URL
    const apiUrl = `${baseUrl}/api?module=transaction&action=gettxreceipt&txhash=${txHash}&apikey=${apiKey || 'YourApiKeyToken'}`
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    if (data.status === '1' && data.result) {
      const result = data.result
      
      return {
        success: true,
        confirmed: true,
        blockNumber: parseInt(result.blockNumber, 16),
        gasUsed: parseInt(result.gasUsed, 16).toString(),
        status: result.status === '0x1' ? 'success' : 'failed',
        confirmations: result.confirmations ? parseInt(result.confirmations, 16) : 0
      }
    } else if (data.status === '0' && data.message === 'No transactions found') {
      return {
        success: false,
        confirmed: false,
        status: 'pending',
        error: 'Transaction not yet mined'
      }
    } else {
      return {
        success: false,
        confirmed: false,
        error: data.message || 'Failed to verify transaction'
      }
    }
  } catch (error) {
    console.error('❌ Etherscan verification failed:', error)
    return {
      success: false,
      confirmed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the appropriate Etherscan API URL for the chain
 */
function getEtherscanApiUrl(chainId: number): string {
  switch (chainId) {
    case 1: // Mainnet
      return 'https://api.etherscan.io'
    case 11155111: // Sepolia
      return 'https://api-sepolia.etherscan.io'
    case 5: // Goerli
      return 'https://api-goerli.etherscan.io'
    default:
      return 'https://api-sepolia.etherscan.io' // Default to Sepolia
  }
}

/**
 * Get Etherscan URL for viewing a transaction
 */
export function getEtherscanTxUrl(txHash: string, chainId: number = 11155111): string {
  switch (chainId) {
    case 1: // Mainnet
      return `https://etherscan.io/tx/${txHash}`
    case 11155111: // Sepolia
      return `https://sepolia.etherscan.io/tx/${txHash}`
    case 5: // Goerli
      return `https://goerli.etherscan.io/tx/${txHash}`
    default:
      return `https://sepolia.etherscan.io/tx/${txHash}`
  }
}

/**
 * Wait for transaction confirmation with polling
 */
export async function waitForTransactionConfirmation(
  txHash: string,
  chainId: number = 11155111,
  requiredConfirmations: number = 2,
  timeoutMs: number = 120000, // 2 minutes
  apiKey?: string
): Promise<TransactionVerificationResult> {
  const startTime = Date.now()
  const pollInterval = 5000 // 5 seconds
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const result = await verifyTransactionOnEtherscan(txHash, chainId, apiKey)
      
      if (result.confirmed && result.status === 'success') {
        if ((result.confirmations || 0) >= requiredConfirmations) {
          console.log(`✅ Transaction confirmed with ${result.confirmations} confirmations`)
          return result
        } else {
          console.log(`⏳ Transaction mined but only ${result.confirmations} confirmations, waiting for ${requiredConfirmations}...`)
        }
      } else if (result.status === 'failed') {
        return {
          success: false,
          confirmed: true,
          status: 'failed',
          error: 'Transaction failed on blockchain'
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
    } catch (error) {
      console.warn('⚠️ Error during confirmation polling:', error)
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
  }
  
  return {
    success: false,
    confirmed: false,
    status: 'pending',
    error: 'Transaction confirmation timeout'
  }
}

/**
 * Comprehensive transaction validation
 */
export async function validateTransaction(
  txHash: string,
  expectedValue?: string,
  expectedTo?: string,
  chainId: number = 11155111,
  apiKey?: string
): Promise<TransactionVerificationResult & { 
  valueMatches?: boolean
  toMatches?: boolean 
}> {
  try {
    console.log(`🔍 Comprehensive validation of transaction ${txHash}`)
    
    const baseUrl = getEtherscanApiUrl(chainId)
    
    // Get transaction details
    const txUrl = `${baseUrl}/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey || 'YourApiKeyToken'}`
    const receiptUrl = `${baseUrl}/api?module=transaction&action=gettxreceipt&txhash=${txHash}&apikey=${apiKey || 'YourApiKeyToken'}`
    
    const [txResponse, receiptResponse] = await Promise.all([
      fetch(txUrl),
      fetch(receiptUrl)
    ])
    
    const txData = await txResponse.json()
    const receiptData = await receiptResponse.json()
    
    if (!txData.result || !receiptData.result) {
      return {
        success: false,
        confirmed: false,
        error: 'Transaction not found'
      }
    }
    
    const tx = txData.result
    const receipt = receiptData.result
    
    const result: TransactionVerificationResult & { 
      valueMatches?: boolean
      toMatches?: boolean 
    } = {
      success: receipt.status === '0x1',
      confirmed: true,
      blockNumber: parseInt(receipt.blockNumber, 16),
      gasUsed: parseInt(receipt.gasUsed, 16).toString(),
      status: receipt.status === '0x1' ? 'success' : 'failed'
    }
    
    // Validate expected values if provided
    if (expectedValue) {
      const txValue = parseInt(tx.value, 16).toString()
      result.valueMatches = txValue === expectedValue
    }
    
    if (expectedTo) {
      result.toMatches = tx.to?.toLowerCase() === expectedTo.toLowerCase()
    }
    
    return result
    
  } catch (error) {
    return {
      success: false,
      confirmed: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }
  }
}
