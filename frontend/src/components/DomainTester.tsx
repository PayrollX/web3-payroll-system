import React, { useState } from 'react'
import { Button, TextField, Box, Typography, Alert, CircularProgress } from '@mui/material'
import { ENSService } from '../services/ensService'
import { useAccount, usePublicClient, useWalletClient, useChainId } from 'wagmi'

/**
 * Domain Tester Component
 * Helps test ENS domain availability and registration
 */
export const DomainTester: React.FC = () => {
  const [domainName, setDomainName] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const chainId = useChainId()

  const ensService = new ENSService(publicClient, walletClient, chainId)

  const handleCheckAvailability = async () => {
    if (!domainName.trim()) {
      setError('Please enter a domain name')
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const availability = await ensService.checkDomainAvailability(domainName)
      
      if (availability.available) {
        setResult(`✅ Domain ${domainName}.eth is AVAILABLE for registration!`)
      } else {
        setResult(`❌ Domain ${domainName}.eth is NOT available. Reason: ${availability.reason}`)
      }
    } catch (err) {
      setError(`Error checking availability: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleGenerateRandom = () => {
    const randomDomain = ensService.generateRandomDomainName()
    setDomainName(randomDomain)
  }

  const handleFindAvailable = async () => {
    if (!domainName.trim()) {
      setError('Please enter a base domain name')
      return
    }

    setIsChecking(true)
    setError(null)
    setResult(null)

    try {
      const availableDomain = await ensService.findAvailableDomain(domainName)
      
      if (availableDomain) {
        setResult(`🎉 Found available domain: ${availableDomain}.eth`)
        setDomainName(availableDomain)
      } else {
        setResult(`😞 Could not find an available variation of ${domainName}.eth`)
      }
    } catch (err) {
      setError(`Error finding available domain: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsChecking(false)
    }
  }

  const handleRegister = async () => {
    if (!domainName.trim()) {
      setError('Please enter a domain name')
      return
    }

    if (!address) {
      setError('Please connect your wallet first')
      return
    }

    setIsRegistering(true)
    setError(null)
    setResult(null)

    try {
      const registrationResult = await ensService.registerDomainReal(domainName)
      setResult(`🎉 Successfully registered ${domainName}.eth! Transaction: ${registrationResult.transactionHash}`)
    } catch (err) {
      setError(`Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        🧪 ENS Domain Tester
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Test ENS domain availability and registration on Sepolia testnet
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Domain Name (without .eth)"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          placeholder="e.g., mycompany"
          fullWidth
          disabled={isChecking || isRegistering}
        />
        <Button
          variant="outlined"
          onClick={handleGenerateRandom}
          disabled={isChecking || isRegistering}
        >
          🎲 Random
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={handleCheckAvailability}
          disabled={isChecking || isRegistering}
          startIcon={isChecking ? <CircularProgress size={20} /> : null}
        >
          {isChecking ? 'Checking...' : 'Check Availability'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleFindAvailable}
          disabled={isChecking || isRegistering}
          startIcon={isChecking ? <CircularProgress size={20} /> : null}
        >
          {isChecking ? 'Finding...' : 'Find Available'}
        </Button>
        
        <Button
          variant="contained"
          color="success"
          onClick={handleRegister}
          disabled={isChecking || isRegistering || !address}
          startIcon={isRegistering ? <CircularProgress size={20} /> : null}
        >
          {isRegistering ? 'Registering...' : 'Register Domain'}
        </Button>
      </Box>

      {!address && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please connect your wallet to register domains
        </Alert>
      )}

      {result && (
        <Alert severity={result.includes('✅') || result.includes('🎉') ? 'success' : 'info'} sx={{ mb: 2 }}>
          {result}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        💡 <strong>Tips:</strong>
        <br />• Use the "Random" button to generate test domain names
        <br />• Use "Find Available" to get variations of your preferred name
        <br />• Make sure you have Sepolia ETH for registration fees
        <br />• Domain "blockstract" is already taken - try a different name!
      </Typography>
    </Box>
  )
}
