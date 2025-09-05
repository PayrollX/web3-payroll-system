// hooks/useENS.ts
import { usePublicClient, useWalletClient, useChainId } from 'wagmi'
import { useMemo, useState } from 'react'
import { ENSService } from '../services/ensService'
import { formatEther } from 'viem'

export interface DomainAvailability {
  available: boolean
  domain: string
  type: 'eth' | 'dns'
  owner?: string | null
  reason?: string
  canImport?: boolean
  dnsImportData?: any
  error?: string
}

export interface ENSRegistrationResult {
  success: boolean
  domain?: string
  transactionHash?: string
  blockNumber?: number
  cost?: string
  error?: string
}

export const useENS = () => {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()
  const [isLoading, setIsLoading] = useState(false)

  const ensService = useMemo(() => {
    if (!publicClient) return null
    
    try {
      return new ENSService(publicClient, walletClient, chainId)
    } catch (error) {
      console.error('Failed to initialize ENS service:', error)
      return null
    }
  }, [publicClient, walletClient, chainId])

  const checkDomainAvailability = async (domainName: string): Promise<DomainAvailability> => {
    if (!ensService) {
      return {
        available: false,
        domain: domainName,
        type: 'eth',
        reason: 'ENS service not available',
        error: 'ENS service not initialized'
      }
    }

    setIsLoading(true)
    try {
      const result = await ensService.checkDomainAvailability(domainName)
      return {
        ...result,
        domain: domainName,
        type: 'eth'
      }
    } catch (error) {
      return {
        available: false,
        domain: domainName,
        type: 'eth',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getRegistrationCost = async (domainName: string, duration: number = 31536000): Promise<string> => {
    if (!ensService) return '0.005'

    try {
      const cost = await ensService.getRegistrationCost(domainName, duration)
      return cost // Already formatted as string
    } catch (error) {
      console.error('Failed to get registration cost:', error)
      return '0.005'
    }
  }

  const registerETHDomain = async (domainName: string, duration: number = 31536000): Promise<ENSRegistrationResult> => {
    if (!ensService) {
      return {
        success: false,
        error: 'ENS service not available'
      }
    }

    setIsLoading(true)
    try {
      return await ensService.registerDomain(domainName, duration)
    } finally {
      setIsLoading(false)
    }
  }

  const importDNSDomain = async (domainName: string): Promise<ENSRegistrationResult> => {
    if (!ensService) {
      return {
        success: false,
        error: 'ENS service not available'
      }
    }

    setIsLoading(true)
    try {
      return await ensService.importDNSDomain(domainName)
    } finally {
      setIsLoading(false)
    }
  }

  const createSubdomain = async (parentDomain: string, subdomain: string, ownerAddress: string) => {
    if (!ensService) {
      return {
        success: false,
        error: 'ENS service not available'
      }
    }

    setIsLoading(true)
    try {
      return await ensService.createSubdomain(parentDomain, subdomain, ownerAddress)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSuggestions = async (baseDomain: string) => {
    if (!ensService) return []

    try {
      return await ensService.getSuggestions(baseDomain)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
      return []
    }
  }

  const validateENSName = (name: string) => {
    if (!ensService) {
      return { valid: false, error: 'ENS service not available' }
    }

    return ensService.validateENSName(name)
  }

  return {
    ensService,
    checkDomainAvailability,
    getRegistrationCost,
    registerETHDomain,
    importDNSDomain,
    createSubdomain,
    generateSuggestions,
    validateENSName,
    isAvailable: !!ensService,
    isLoading
  }
}
