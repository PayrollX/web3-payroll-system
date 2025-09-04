import React from 'react'
import { Box, Typography, Card, CardContent, Alert } from '@mui/material'

const Bonuses: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bonus Management
      </Typography>
      <Card>
        <CardContent>
          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Bonus Management Coming Soon
            </Typography>
            <Typography variant="body2">
              This feature will allow you to create and distribute performance bonuses to employees.
              It will include bulk bonus distribution, performance-based calculations, and bonus history tracking.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Bonuses

