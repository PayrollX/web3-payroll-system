import React from 'react'
import { Navigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuth } from '../../context/AuthContext'

interface RegistrationGuardProps {
  children: React.ReactNode
}

/**
 * RegistrationGuard - Prevents registered companies from accessing registration page
 * Redirects to dashboard if company already exists
 * Uses centralized AuthContext to prevent conflicts and loops
 */
const RegistrationGuard: React.FC<RegistrationGuardProps> = ({ children }) => {
  const { isConnected, hasCompany, loading } = useAuth()

  console.log('🚧 RegistrationGuard: isConnected:', isConnected, 'hasCompany:', hasCompany, 'loading:', loading)

  // Show loading while checking authentication status
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh', 
          gap: 2 
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Checking registration status...
        </Typography>
      </Box>
    )
  }

  // If not connected, allow access to registration page
  if (!isConnected) {
    return <>{children}</>
  }

  // If wallet is connected and has a company, redirect to dashboard
  if (hasCompany) {
    console.log('🚧 RegistrationGuard: Redirecting to /dashboard (has company)')
    return <Navigate to="/dashboard" replace />
  }

  // If wallet is connected but no company, allow registration
  return <>{children}</>
}

export default RegistrationGuard
