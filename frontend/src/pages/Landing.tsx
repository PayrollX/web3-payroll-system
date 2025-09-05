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
  PlayCircle,
  Rocket,
  Shield,
  // Replacing Zap with Bolt which exists in MUI icons
  Bolt,
  // Replacing Globe with Public which exists in MUI icons 
  Public,
  // Replacing BarChart3 with BarChart which exists in MUI icons
  BarChart,
  // Replacing Coins with AttachMoney which exists in MUI icons
  AttachMoney,
  Lock,
} from '@mui/icons-material'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import background from '../assets/background.png'
import WalletDebug from '../components/WalletDebug'

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
  sublabel?: string
  color: string
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  return (
    <div className="transform hover:scale-102 hover:-translate-y-1 transition duration-200">
      <div className={`h-full rounded-3xl border border-opacity-20 hover:shadow-lg hover:border-opacity-40 transition-all duration-300`} style={{borderColor: color, background: `linear-gradient(135deg, ${color}1a 0%, ${color}0d 100%)`}}>
        <div className="p-8">
          <div className={`w-15 h-15 rounded-lg flex items-center justify-center mb-6`} style={{background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`}}>
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-4">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

const StatCard: React.FC<StatCardProps> = ({ value, label, sublabel, color }) => (
  <div>
    <div className={`p-6 text-center rounded-lg border border-opacity-20`} style={{borderColor: color, background: `linear-gradient(135deg, ${color}1a 0%, ${color}0d 100%)`}}>
      <h2 className="text-4xl font-bold mb-2" style={{color}}>{value}</h2>
      <p className="text-gray-600 font-medium">{label}</p>
      {sublabel && <p className="text-gray-500 text-sm mt-1">{sublabel}</p>}
    </div>
  </div>
)

const Landing: React.FC = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { isConnected, hasCompany } = useAuth()
  const [showFeatures, setShowFeatures] = useState(false)
  const [animatedStats, setAnimatedStats] = useState({
    users: 0,
    transactions: 0,
    saved: 0,
  })

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 500)
    return () => clearTimeout(timer)
  }, [])

  // Removed automatic redirect - let user choose their path
  // This was causing redirect loops with ProtectedRoute

  useEffect(() => {
    const animateStats = () => {
      const targets = { users: 10, transactions: 250, saved: 95 };
      const duration = 2000;
      const steps = 60;
      let current = { users: 0, transactions: 0, saved: 0 };
      
      const increment = {
        users: targets.users / steps,
        transactions: targets.transactions / steps,
        saved: targets.saved / steps
      };

      const timer = setInterval(() => {
        current.users = Math.min(current.users + increment.users, targets.users);
        current.transactions = Math.min(current.transactions + increment.transactions, targets.transactions);
        current.saved = Math.min(current.saved + increment.saved, targets.saved);
        
        setAnimatedStats({
          users: Math.floor(current.users),
          transactions: Math.floor(current.transactions),
          saved: Math.floor(current.saved)
        });

        if (current.users >= targets.users && 
            current.transactions >= targets.transactions && 
            current.saved >= targets.saved) {
          clearInterval(timer);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id === 'stats') {
            animateStats();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsElement = document.getElementById('stats');
    if (statsElement) observer.observe(statsElement);

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Military-Grade Security",
      description: "Multi-signature wallets and smart contract audits ensure your payroll is protected by the highest security standards.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Bolt className="w-8 h-8 text-purple-600" />,
      title: "Lightning Fast Payments",
      description: "Process payroll in minutes, not days. Automated smart contracts execute payments instantly across the globe.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Public className="w-8 h-8 text-emerald-600" />,
      title: "Global Workforce",
      description: "Pay employees worldwide without traditional banking limitations. Support for 50+ countries and multiple cryptocurrencies.",
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: <BarChart className="w-8 h-8 text-orange-600" />,
      title: "Advanced Analytics",
      description: "Real-time insights into payroll costs, employee metrics, and financial forecasting with beautiful dashboards.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: <AttachMoney className="w-8 h-8 text-yellow-600" />,
      title: "Multi-Token Support",
      description: "Pay in ETH, USDC, DAI, or any ERC-20 token. Automatic conversion and competitive exchange rates included.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Lock className="w-8 h-8 text-indigo-600" />,
      title: "Compliance Ready",
      description: "Built-in tax reporting, audit trails, and regulatory compliance for enterprises in any jurisdiction.",
      gradient: "from-indigo-500 to-purple-500"
    }
  ];

  const benefits = [
    'Reduce payroll processing time by 90%',
    'Eliminate intermediary fees and delays',
    'Ensure complete transparency and auditability',
    'Support global workforce with instant payments',
    'Integrate with existing HR systems',
    'Maintain regulatory compliance',
  ]

  return (
    <div className="min-h-screen" style={{background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)`}}>
      {/* Wallet Debug Component - Remove in production */}
      <WalletDebug />
      
      {/* Navigation */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="py-6 flex justify-between items-center">
            <div>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 mr-4 w-12 h-12 rounded-full flex items-center justify-center shadow-md">
                  <PaymentIcon className="text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">PayrollX</h1>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-8">
                <nav className="hidden md:flex items-center space-x-6 mr-8">
                  <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Features</a>
                  <a href="#stats" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Stats</a>
                  <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">How It Works</a>
                  <a href="#benefits" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Benefits</a>
                </nav>
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
     {/* Hero Section */}
     <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[url('/src/assets/background.png')] bg-cover bg-center">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 pt-20 mb-96">
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-8 shadow-lg">
              <Rocket className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Trusted by 100+ companies worldwide</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                The Future
              </span>
              <br />
              <span className="text-gray-900">of Payroll</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              <span className="font-semibold text-gray-800">For Employers:</span> Manage your company payroll with crypto. 
              Add employees, they get <span className="font-semibold text-gray-800">auto-generated ENS domains</span>, 
              and receive payments directly to their wallets.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
              {/* Dynamic CTA based on user state */}
              {isConnected && hasCompany ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                      transform: 'scale(1.05)',
                    },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Go to Dashboard
                </Button>
              ) : isConnected && !hasCompany ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    borderRadius: 3,
                    background: 'linear-gradient(45deg, #f59e0b, #d97706)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #d97706, #b45309)',
                      transform: 'scale(1.05)',
                    },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Register Your Company
                </Button>
              ) : (
                <ConnectButton />
              )}
              <button className="group bg-white/60 backdrop-blur-sm border border-white/20 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                <PlayCircle className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Indicators */}
            
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>
      {/* Stats Section */}
      <section id="stats" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <StatCard
                  value={`${animatedStats.users.toLocaleString()}+`}
                  label="Happy Users"
                  sublabel="Across 50+ countries"
                  color="from-blue-50 to-cyan-50"
                />
                <StatCard
                  value={`$${(animatedStats.transactions / 1000000).toFixed(1)}M+`}
                  label="Processed"
                  sublabel="In total payroll volume"
                  color="from-purple-50 to-pink-50"
                />
                <StatCard
                  value={`${animatedStats.saved}%`}
                  label="Time Saved"
                  sublabel="Compared to traditional payroll"
                  color="from-emerald-50 to-teal-50"
                />
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold mb-4">
                  Enterprise-Grade Platform
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                  Built for <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Scale & Security</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Trusted by Fortune 500 companies, our platform offers institutional-level security and compliance.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <FeatureCard color={''} key={index} {...feature} />
                ))}
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <span className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold mb-4">
                  Simple Implementation
                </span>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                  How It <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Works</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Set up and automate your payroll in under 10 minutes with our intuitive platform.
                </p>
              </div>
              <div className="relative">
                {/* <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 transform -translate-y-1/2"></div> */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="group text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-100/20 rounded-2xl blur-lg group-hover:scale-105 transition-transform"></div>
                      <div className="relative bg-white p-6 rounded-2xl shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <WalletIcon className="w-8 h-8 text-white" />
                        </div>
                        <span className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect & Configure</h3>
                    <p className="text-gray-600">Connect your wallet, complete KYB, and set up your company profile.</p>
                  </div>
                  <div className="group text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-purple-100/20 rounded-2xl blur-lg group-hover:scale-105 transition-transform"></div>
                      <div className="relative bg-white p-6 rounded-2xl shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                          {/* Import UserGroupIcon from heroicons/react */}
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="absolute -top-3 -right-3 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Team & Schedules</h3>
                    <p className="text-gray-600">Import employees and configure salaries and payment schedules.</p>
                  </div>
                  <div className="group text-center">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-emerald-100/20 rounded-2xl blur-lg group-hover:scale-105 transition-transform"></div>
                      <div className="relative bg-white p-6 rounded-2xl shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <TrendingUpIcon className="w-8 h-8 text-white" />
                        </div>
                        <span className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Launch & Monitor</h3>
                    <p className="text-gray-600">Activate payments and monitor via real-time dashboards.</p>
                  </div>
                </div>
              </div>
              
            </div>
          </section>


      {/* Benefits Section */}
      <div id="benefits" className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-7xl py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">
                Why Choose PayrollX?
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Transform your payroll operations with cutting-edge blockchain technology
                that provides unmatched security, transparency, and efficiency.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center">
                    <CheckIcon className="text-green-500 mr-4" />
                    <span className="text-lg font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="h-96 rounded-xl flex items-center justify-center" style={{background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)`}}>
                <p className="text-2xl text-gray-600">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

     

      {/* Footer */}
      <hr />
      <div className="container mx-auto max-w-7xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center mb-4">
              <div className="bg-blue-600 rounded-full p-2 mr-4">
                <PaymentIcon className="text-white" />
              </div>
              <h3 className="text-xl font-bold">PayrollX</h3>
            </div>
            <p className="text-gray-600">
              The future of payroll management is here.
              
            </p>
          </div>
          <div className="flex justify-center md:justify-end space-x-4">
            <button className="text-blue-600">
              <GitHubIcon />
            </button>
            <button className="text-blue-600">
              <TwitterIcon />
            </button>
            <button className="text-blue-600">
              <LinkedInIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Landing