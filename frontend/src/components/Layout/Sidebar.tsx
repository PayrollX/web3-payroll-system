import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  CardGiftcard as BonusIcon,
  Language as ENSIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../store/store'

/**
 * Sidebar component for Web3 Payroll System
 * @author Dev Austin
 */

const drawerWidth = 240

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path: string
  badge?: number
}

const Sidebar: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen } = useAppSelector((state) => state.ui)
  const { totalEmployees, activeEmployees } = useAppSelector((state) => state.employees)
  const { payments } = useAppSelector((state) => state.payroll)

  const navigationItems: NavigationItem[] = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Employees',
      icon: <PeopleIcon />,
      path: '/employees',
      badge: totalEmployees,
    },
    {
      text: 'Payroll',
      icon: <PaymentIcon />,
      path: '/payroll',
    },
    {
      text: 'Bonuses',
      icon: <BonusIcon />,
      path: '/bonuses',
    },
    {
      text: 'ENS Management',
      icon: <ENSIcon />,
      path: '/ens',
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {/* Company Info */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Company
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={`${activeEmployees} Active`} 
            size="small" 
            color="success" 
            variant="outlined"
          />
          <Chip 
            label={`${totalEmployees} Total`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ pt: 2 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path
          
          return (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'primary.main',
                      color: isActive ? 'white' : 'white',
                      fontSize: '0.75rem',
                      height: 20,
                      minWidth: 20,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Footer */}
      <Box sx={{ mt: 'auto', p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Web3 Payroll System
        </Typography>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Built with ❤️ by Dev Austin
        </Typography>
      </Box>
    </Drawer>
  )
}

export default Sidebar

