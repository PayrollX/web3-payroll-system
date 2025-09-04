import React, { useState } from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  alpha,
  Paper,
  Stack,
  Chip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  CardGiftcard as BonusIcon,
  Dns as ENSIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useAppSelector } from '../../store/store'
// import { motion, AnimatePresence } from 'framer-motion'

/**
 * Professional Dashboard Layout with sidebar navigation
 * @author Dev Austin
 */

interface DashboardLayoutProps {
  children: React.ReactNode
}

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path: string
  badge?: number
  color?: string
}

const DRAWER_WIDTH = 280

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { notifications } = useAppSelector((state) => state.ui)
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navigationItems: NavigationItem[] = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      color: theme.palette.primary.main,
    },
    {
      text: 'Employees',
      icon: <PeopleIcon />,
      path: '/employees',
      color: theme.palette.secondary.main,
    },
    {
      text: 'Payroll',
      icon: <PaymentIcon />,
      path: '/payroll',
      badge: 3, // Example pending payments
      color: theme.palette.success.main,
    },
    {
      text: 'Bonuses',
      icon: <BonusIcon />,
      path: '/bonuses',
      color: theme.palette.warning.main,
    },
    {
      text: 'ENS Management',
      icon: <ENSIcon />,
      path: '/ens',
      color: theme.palette.info.main,
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      color: theme.palette.error.main,
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      color: theme.palette.text.secondary,
    },
  ]

  const handleNavigation = (path: string) => {
    navigate(path)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const isCurrentPath = (path: string) => {
    return location.pathname === path
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${alpha(theme.palette.secondary.main, 0.95)} 100%)`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              onClick={toggleSidebar}
              edge="start"
              sx={{ mr: 2 }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  mr: 2,
                  width: 40,
                  height: 40,
                }}
              >
                <PaymentIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold" color="inherit">
                PayrollX
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Network Status */}
            <Chip
              label="Ethereum"
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
              }}
            />

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Account */}
            <Tooltip title="Account">
              <IconButton color="inherit">
                <AccountIcon />
              </IconButton>
            </Tooltip>

            {/* Connect Button */}
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      {sidebarOpen && (
            <Drawer
              variant="permanent"
              sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  width: DRAWER_WIDTH,
                  boxSizing: 'border-box',
                  background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '0 20px 20px 0',
                  overflow: 'hidden',
                },
              }}
            >
              <Toolbar />
              
              {/* User Profile Section */}
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mx: 'auto',
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  {address?.slice(2, 4).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1" fontWeight="bold">
                  Admin User
                </Typography>
                <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                </Typography>
              </Box>

              <Divider sx={{ mx: 2 }} />

              {/* Navigation */}
              <List sx={{ p: 2, flex: 1 }}>
                {navigationItems.map((item) => {
                  const isActive = isCurrentPath(item.path)
                  const isHovered = hoveredItem === item.text
                  
                  return (
                    <Box key={item.text}>
                      <ListItem
                        disablePadding
                        sx={{ mb: 1 }}
                        onMouseEnter={() => setHoveredItem(item.text)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <ListItemButton
                          onClick={() => handleNavigation(item.path)}
                          sx={{
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            background: isActive
                              ? `linear-gradient(135deg, ${alpha(item.color || theme.palette.primary.main, 0.2)} 0%, ${alpha(item.color || theme.palette.primary.main, 0.1)} 100%)`
                              : isHovered
                              ? alpha(theme.palette.action.hover, 0.5)
                              : 'transparent',
                            border: isActive
                              ? `1px solid ${alpha(item.color || theme.palette.primary.main, 0.3)}`
                              : '1px solid transparent',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${alpha(item.color || theme.palette.primary.main, 0.1)} 0%, ${alpha(item.color || theme.palette.primary.main, 0.05)} 100%)`,
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              color: isActive
                                ? item.color || theme.palette.primary.main
                                : theme.palette.text.secondary,
                              transition: 'color 0.3s ease',
                            }}
                          >
                            {item.badge ? (
                              <Badge badgeContent={item.badge} color="error">
                                {item.icon}
                              </Badge>
                            ) : (
                              item.icon
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 'bold' : 'medium',
                              color: isActive
                                ? item.color || theme.palette.primary.main
                                : theme.palette.text.primary,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    </Box>
                  )
                })}
              </List>

              {/* Bottom Actions */}
              <Box sx={{ p: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1}>
                  <Paper
                    sx={{
                      p: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      System Status
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      All systems operational
                    </Typography>
                  </Paper>

                  <ListItemButton
                    sx={{
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                      },
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Disconnect"
                      primaryTypographyProps={{
                        color: 'error.main',
                        fontWeight: 'medium',
                      }}
                    />
                  </ListItemButton>
                </Stack>
              </Box>
            </Drawer>
        )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: 'margin-left 0.3s ease',
          marginLeft: sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
        }}
      >
        <Toolbar />
        <Box sx={{ opacity: 1, transform: 'translateY(0)' }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardLayout
