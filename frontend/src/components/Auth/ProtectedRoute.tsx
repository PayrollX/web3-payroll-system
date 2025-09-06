/**
 * Protected Route Component
 * Wraps routes that require authentication
 * @author Dev Austin
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Box, CircularProgress, Typography } from '@mui/material'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

  // Redirect to company registration if connected but no company
  if (!hasCompany) {
    return <Navigate to="/register" state={{ from: location }} replace />
  }

  // Render protected content
  return <>{children}</>
}

export default ProtectedRoute
