import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { Box, CircularProgress, Typography } from '@mui/material'

/**
 * Protected Route component that requires wallet connection
 * @author Dev Austin
 */

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, isConnecting } = useAccount()

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Connecting to wallet...
        </Typography>
      </Box>
    )
  }

  // Redirect to landing page if not connected
  if (!isConnected) {
    return <Navigate to="/" replace />
  }

  // Render children if connected
  return <>{children}</>
}

export default ProtectedRoute


