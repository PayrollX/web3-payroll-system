import React, { useState, useEffect } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  alpha,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Analytics as AnalyticsIcon,
  Dns as ENSIcon,
  AccountBalanceWallet as WalletIcon,
  Notifications as NotificationsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAppDispatch, useAppSelector } from '../../store/store'
import { toggleSidebar, setSidebarOpen, setTheme } from '../../store/slices/uiSlice'
import { useAuth } from '../../context/AuthContext'

const DRAWER_WIDTH = 280
const MINI_DRAWER_WIDTH = 64

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { disconnect } = useDisconnect()
  
  // Redux state
  const { sidebarOpen, theme: currentTheme, notifications } = useAppSelector(state => state.ui)
  
  // Auth state
  const { address, isConnected } = useAccount()
  const { hasCompany } = useAuth()
  
  // Local state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      dispatch(setSidebarOpen(false))
    } else {
      dispatch(setSidebarOpen(true))
    }
  }, [isMobile, dispatch])

  // Handle sidebar toggle
  const handleDrawerToggle = () => {
    dispatch(toggleSidebar())
  }

  // Handle theme toggle
  const handleThemeToggle = () => {
    dispatch(setTheme(currentTheme === 'light' ? 'dark' : 'light'))
  }

  // Handle profile menu
  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileClose = () => {
    setAnchorEl(null)
  }

  // Handle notifications
  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget)
  }

  const handleNotificationsClose = () => {
    setNotificationAnchor(null)
  }

  // Handle logout
  const handleLogout = async () => {
    handleProfileClose()
    await disconnect()
    navigate('/')
  }

  // Navigation items
  const navigationItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      badge: null,
    },
    {
      text: 'Employees',
      icon: <PeopleIcon />,
      path: '/employees',
      badge: null,
    },
    {
      text: 'Payroll',
      icon: <PaymentIcon />,
      path: '/payroll',
      badge: null,
    },
    {
      text: 'ENS Management',
      icon: <ENSIcon />,
      path: '/ens',
      badge: null,
    },
    {
      text: 'Analytics',
      icon: <AnalyticsIcon />,
      path: '/analytics',
      badge: null,
    },
  ]

  // Get network status for display
  const getNetworkStatus = () => {
    if (!isConnected) return { text: 'Not Connected', color: 'error' as const }
    if (!hasCompany) return { text: 'No Company', color: 'warning' as const }
    return { text: 'Connected', color: 'success' as const }
  }

  const networkStatus = getNetworkStatus()

  // Sidebar content
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and brand */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          minHeight: 64,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {sidebarOpen && (
          <>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              <WalletIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                PayrollX
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Web3 Payroll System
              </Typography>
            </Box>
          </>
        )}
        {!sidebarOpen && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
            }}
          >
            <WalletIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
        )}
      </Box>

      {/* Network status */}
      {sidebarOpen && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Chip
            icon={<SecurityIcon />}
            label={networkStatus.text}
            color={networkStatus.color}
            size="small"
            sx={{ width: '100%' }}
          />
        </Box>
      )}

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path
          
          return (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  mb: 0.5,
                  minHeight: 48,
                  bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                  '&:hover': {
                    bgcolor: isActive 
                      ? alpha(theme.palette.primary.main, 0.15) 
                      : alpha(theme.palette.action.hover, 0.08),
                  },
                  ...(isActive && {
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    ml: 0.5,
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    minWidth: sidebarOpen ? 40 : 'auto',
                    justifyContent: 'center',
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
                {sidebarOpen && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Sidebar footer with collapse button */}
      {!isMobile && (
        <>
          <Divider />
          <Box sx={{ p: 1 }}>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                width: '100%',
                borderRadius: 2,
                py: 1.5,
              }}
            >
              {sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: isMobile ? '100%' : `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)`,
          ml: isMobile ? 0 : `${sidebarOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px`,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Box>
              <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                {navigationItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
              </Typography>
              {address && (
                <Typography variant="caption" color="text.secondary">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme toggle */}
            <Tooltip title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={handleThemeToggle} color="inherit">
                {currentTheme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton onClick={handleNotificationsClick} color="inherit">
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Wallet Connection */}
            {isConnected ? (
              <Button
                onClick={handleProfileClick}
                startIcon={<AccountCircleIcon />}
                sx={{
                  ml: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {hasCompany ? 'Company Owner' : 'No Company'}
                  </Typography>
                </Box>
              </Button>
            ) : (
              <ConnectButton />
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? sidebarOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          width: sidebarOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          width: isMobile ? '100%' : `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : MINI_DRAWER_WIDTH}px)`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem onClick={handleLogout}>
          <LogoutIcon sx={{ mr: 2 }} />
          Disconnect Wallet
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1,
            maxWidth: 360,
            borderRadius: 2,
          },
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem key={notification.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  )
}

export default DashboardLayout
