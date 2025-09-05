/**
 * Wallet Debug Component
 * Helps troubleshoot wallet connection issues
 * @author Dev Austin
 */

import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button, Box, Typography, Alert, Chip } from '@mui/material'
import { clearWalletCache, getWalletInfo } from '../utils/walletUtils'

const WalletDebug: React.FC = () => {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [walletInfo, setWalletInfo] = useState<any>(null)

  useEffect(() => {
    const info = getWalletInfo()
    setWalletInfo(info)
  }, [address, isConnected])

  const handleClearCache = () => {
    clearWalletCache()
    setWalletInfo(getWalletInfo())
  }

  const handleForceDisconnect = () => {
    disconnect()
    clearWalletCache()
    window.location.reload()
  }

  return (
    <Box sx={{ p: 3, border: '1px solid #ccc', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔧 Wallet Debug Information
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Current Connection Status:
        </Typography>
        <Chip 
          label={isConnected ? 'Connected' : 'Disconnected'} 
          color={isConnected ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {address && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Connected Address:
          </Typography>
          <Typography variant="body2" fontFamily="monospace">
            {address}
          </Typography>
        </Box>
      )}

      {connector && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Connector:
          </Typography>
          <Typography variant="body2">
            {connector.name}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Available Connectors:
        </Typography>
        {connectors.map((conn) => (
          <Chip 
            key={conn.id} 
            label={conn.name} 
            size="small" 
            sx={{ mr: 1, mb: 1 }}
          />
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          LocalStorage Wallet Info:
        </Typography>
        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem' }}>
          {JSON.stringify(walletInfo, null, 2)}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleClearCache}
        >
          Clear Wallet Cache
        </Button>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleForceDisconnect}
        >
          Force Disconnect & Reload
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 2 }}>
        If you're seeing a specific address (0x42Fb6B10397b314ba2100c73c0899942C3e44929) 
        instead of the wallet selection modal, try clicking "Force Disconnect & Reload" 
        to clear all cached wallet data.
      </Alert>
    </Box>
  )
}

export default WalletDebug
