import React from 'react'
import { Box, Typography, Card, CardContent, Alert } from '@mui/material'

const Analytics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics & Reporting
      </Typography>
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Analytics Dashboard Coming Soon
            </Typography>
            <Typography variant="body2">
              This feature will provide comprehensive analytics including payroll trends, 
              employee cost analysis, department breakdowns, and custom reporting capabilities.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Analytics

