/**
 * Company Registration Guard Component
 * Ensures user is connected but redirects away if they already have a company
 * @author Dev Austin
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Box, CircularProgress, Typography } from '@mui/material'

interface CompanyRegistrationGuardProps {
  children: React.ReactNode
}

const CompanyRegistrationGuard: React.FC<CompanyRegistrationGuardProps> = ({ children }) => {
  const { isConnected, loading, hasCompany } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Checking authentication...
        </Typography>
      </Box>
    )
  }

  // Redirect to landing page if not connected
  if (!isConnected) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // Redirect to dashboard if already has company
  if (hasCompany) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />
  }

  // Render registration form for connected users without company
  return <>{children}</>
}

export default CompanyRegistrationGuard
