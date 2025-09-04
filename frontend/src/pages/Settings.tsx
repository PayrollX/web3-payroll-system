import React from 'react'
import { Box, Typography, Card, CardContent, Alert } from '@mui/material'

const Settings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Settings Panel Coming Soon
            </Typography>
            <Typography variant="body2">
              This feature will allow you to configure company settings, payment preferences, 
              ENS domain settings, and security preferences.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Settings

