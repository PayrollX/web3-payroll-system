import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Fade,
  Slide,
  Zoom,
  useTheme,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Paper,
} from '@mui/material'
import {
  AccountBalanceWallet as WalletIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Public as PublicIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Shield as ShieldIcon,
  Dns as DnsIcon,
  Analytics as AnalyticsIcon,
  ArrowForward as ArrowForwardIcon,
  GitHub as GitHubIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
// import { motion } from 'framer-motion'

/**
 * Professional Landing Page for Web3 Payroll System
 * @author Dev Austin
 */

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

interface StatCardProps {
  value: string
  label: string
  color: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  const theme = useTheme()
  
  return (
    <Box sx={{ '&:hover': { transform: 'scale(1.02) translateY(-4px)' }, transition: 'transform 0.2s ease' }}>
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          borderRadius: 3,
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: `0 8px 32px ${alpha(color, 0.3)}`,
            border: `1px solid ${alpha(color, 0.4)}`,
          },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color }) => (
  <Box>
    <Paper
      sx={{
        p: 3,
        textAlign: 'center',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h3" fontWeight="bold" color={color} sx={{ mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  </Box>
)

const Landing: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isConnected, navigate])

  const features = [
    {
      icon: <SecurityIcon sx={{ color: 'white', fontSize: 30 }} />,
      title: 'Secure & Trustless',
      description: 'Built on Ethereum with smart contracts that ensure transparent and immutable payroll processing.',
      color: '#2196F3',
    },
    {
      icon: <DnsIcon sx={{ color: 'white', fontSize: 30 }} />,
      title: 'ENS Integration',
      description: 'Seamlessly manage employee identities with Ethereum Name Service for human-readable addresses.',
      color: '#9C27B0',
    },
    {
      icon: <SpeedIcon sx={{ color: 'white', fontSize: 30 }} />,
      title: 'Automated Processing',
      description: 'Schedule recurring payments and automate your entire payroll workflow with smart contract automation.',
      color: '#FF9800',
    },
    {
      icon: <AnalyticsIcon sx={{ color: 'white', fontSize: 30 }} />,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboards and reporting tools to track payroll expenses and employee metrics.',
      color: '#4CAF50',
    },
    {
      icon: <PaymentIcon sx={{ color: 'white', fontSize: 30 }} />,
      title: 'Multi-Token Support',
      description: 'Pay employees in ETH, USDC, DAI, or other supported tokens with automatic conversion rates.',
      color: '#F44336',
    },
    {
      icon: <ShieldIcon sx={{ color: 'white', fontSize: 30 }} />,
      title: 'Enterprise Security',
      description: 'Military-grade encryption and multi-signature support for maximum security and compliance.',
      color: '#795548',
    },
  ]

  const benefits = [
    'Reduce payroll processing time by 90%',
    'Eliminate intermediary fees and delays',
    'Ensure complete transparency and auditability',
    'Support global workforce with instant payments',
    'Integrate with existing HR systems',
    'Maintain regulatory compliance',
  ]

  return (
    <Box sx={{ minHeight: '100vh', background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)` }}>
      {/* Navigation */}
      <Container maxWidth="lg">
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  mr: 2,
                  width: 48,
                  height: 48,
                }}
              >
                <PaymentIcon />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" color="primary">
                PayrollX
              </Typography>
            </Box>
          </Box>

          <Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button variant="text" color="primary">
                Features
              </Button>
              <Button variant="text" color="primary">
                Pricing
              </Button>
              <Button variant="text" color="primary">
                Docs
              </Button>
              <ConnectButton />
            </Stack>
          </Box>
        </Box>
      </Container>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Box>
            <Chip
              label="🚀 Now in Beta"
              sx={{
                mb: 4,
                px: 2,
                py: 1,
                fontSize: '0.9rem',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                color: 'white',
                fontWeight: 'bold',
              }}
            />
          </Box>

          <Box
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem' },
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              The Future of
              <br />
              Payroll
            </Typography>
          </Box>

          <Box
          >
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{
                mb: 6,
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Revolutionize your payroll management with blockchain technology.
              Secure, transparent, and efficient payments for the modern workforce.
            </Typography>
          </Box>

          <Box
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={3}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 8 }}
            >
              <ConnectButton.Custom>
                {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
                  return (
                    <div
                      {...(!mounted && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!mounted || !account || !chain) {
                          return (
                            <Button
                              onClick={openConnectModal}
                              variant="contained"
                              size="large"
                              startIcon={<WalletIcon />}
                              endIcon={<ArrowForwardIcon />}
                              sx={{
                                px: 4,
                                py: 2,
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                '&:hover': {
                                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
                                  transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              Connect Wallet to Get Started
                            </Button>
                          )
                        }

                        return (
                          <Box
                          >
                            <Paper
                              sx={{
                                p: 3,
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${theme.palette.success.main}20 0%, ${theme.palette.success.main}10 100%)`,
                                border: `2px solid ${theme.palette.success.main}40`,
                                textAlign: 'center',
                              }}
                            >
                              <CheckIcon sx={{ color: 'success.main', fontSize: 40, mb: 2 }} />
                              <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
                                Wallet Connected!
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Redirecting to dashboard...
                              </Typography>
                              <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                                {account.address}
                              </Typography>
                            </Paper>
                          </Box>
                        )
                      })()}
                    </div>
                  )
                }}
              </ConnectButton.Custom>

              <Button
                variant="outlined"
                size="large"
                endIcon={<LaunchIcon />}
                sx={{
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  borderRadius: 3,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                View Demo
              </Button>
            </Stack>
          </Box>

          {/* Stats */}
          <Box
          >
            <Grid container spacing={4} sx={{ mb: 8 }}>
              <Grid item xs={12} sm={4}>
                <StatCard value="$2.5M+" label="Total Processed" color={theme.palette.primary.main} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard value="500+" label="Companies" color={theme.palette.secondary.main} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard value="99.9%" label="Uptime" color={theme.palette.success.main} />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          <Box
          >
            <Typography
              variant="h2"
              fontWeight="bold"
              textAlign="center"
              sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
            >
              Powerful Features
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 8, maxWidth: 600, mx: 'auto' }}
            >
              Everything you need to manage payroll in the Web3 era
            </Typography>
          </Box>

          <Fade in={showFeatures} timeout={1000}>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box
                  >
                    <FeatureCard {...feature} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Fade>
        </Box>
      </Container>

      {/* Benefits Section */}
      <Box sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
        <Container maxWidth="lg">
          <Box sx={{ py: 8 }}>
            <Grid container spacing={8} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                >
                  <Typography variant="h3" fontWeight="bold" sx={{ mb: 4 }}>
                    Why Choose PayrollX?
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                    Transform your payroll operations with cutting-edge blockchain technology
                    that provides unmatched security, transparency, and efficiency.
                  </Typography>
                  <List>
                    {benefits.map((benefit, index) => (
                      <Box
                        key={index}
                      >
                        <ListItem sx={{ px: 0 }}>
                          <ListItemIcon>
                            <CheckIcon sx={{ color: 'success.main' }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={benefit}
                            primaryTypographyProps={{
                              fontWeight: 500,
                              fontSize: '1.1rem',
                            }}
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: 400,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="h4" color="text.secondary">
                      Dashboard Preview
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Box
          >
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 3 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6, maxWidth: 500, mx: 'auto' }}>
              Join thousands of companies already using PayrollX to streamline their payroll operations.
            </Typography>
            <ConnectButton />
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Divider />
      <Container maxWidth="lg">
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                  <PaymentIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">
                  PayrollX
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                The future of payroll management is here.
                <br />
                Built with ❤️ for the Web3 community.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'center', md: 'flex-end' }}>
                <IconButton color="primary">
                  <GitHubIcon />
                </IconButton>
                <IconButton color="primary">
                  <TwitterIcon />
                </IconButton>
                <IconButton color="primary">
                  <LinkedInIcon />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}

export default Landing
