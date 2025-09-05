import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../../context/AuthContext'

/**
 * Protected Route component that requires wallet connection and company registration
 * Uses centralized AuthContext to prevent conflicts and loops
 */

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isConnected, hasCompany, loading } = useAuth()

  console.log('🛡️ ProtectedRoute: isConnected:', isConnected, 'hasCompany:', hasCompany, 'loading:', loading)

  // Show loading state while checking company status
  if (loading) {
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
          Checking authentication status...
        </Typography>
      </Box>
    )
  }

  // Redirect to landing page if not connected
  if (!isConnected) {
    return <Navigate to="/" replace />
  }

  // Redirect to registration if connected but no company
  if (!hasCompany) {
    console.log('🛡️ ProtectedRoute: Redirecting to /register (no company)')
    return <Navigate to="/register" replace />
  }

  // Render children if connected and has company
  return <>{children}</>
}

export default ProtectedRoute