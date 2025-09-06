# 🚀 Web3 Payroll System Deployment Guide

## 📋 Prerequisites

Before deploying the Web3 Payroll System, ensure you have the following:

### Required Software
- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Redis (local or Redis Cloud)
- Git

### Required Accounts & API Keys
- [Alchemy](https://www.alchemy.com/) account for Ethereum RPC
- [Etherscan](https://etherscan.io/) account for contract verification
- [WalletConnect](https://walletconnect.com/) account for wallet connections
- [MongoDB Atlas](https://www.mongodb.com/atlas) (optional, for cloud database)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/overview/) (optional, for cloud Redis)

### Required Wallets
- MetaMask or compatible wallet
- Testnet ETH (Sepolia/Goerli) for testing
- Mainnet ETH for production deployment

## 🏗️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd web3-payroll-system

# Install root dependencies
npm install

# Install contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Blockchain Configuration
ALCHEMY_API_KEY=your_alchemy_api_key
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/web3payroll
REDIS_URL=redis://localhost:6379

# Frontend Configuration
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
REACT_APP_API_URL=http://localhost:3001
```

### 3. Start Local Services

```bash
# Start MongoDB (if running locally)
mongod

# Start Redis (if running locally)
redis-server

# Start all services in development mode
npm run dev
```

This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000
- Smart contract compilation and testing

## 🧪 Smart Contract Deployment

### 1. Testnet Deployment (Recommended First)

```bash
cd contracts

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts on Etherscan
npm run verify:sepolia
```

### 2. Update Frontend Configuration

After deployment, update your frontend environment variables:

```env
REACT_APP_PAYROLL_MANAGER_SEPOLIA=0x... # Your deployed contract address
```

### 3. Test Contract Functions

```bash
# Run comprehensive tests
npm test

# Test specific functionality
npm run test:payroll
npm run test:ens
```

### 4. Mainnet Deployment (Production)

⚠️ **WARNING**: Only deploy to mainnet after thorough testing on testnet!

```bash
# Deploy to Ethereum mainnet
npm run deploy:mainnet

# Verify contracts on Etherscan
npm run verify:mainnet
```

Update production environment variables:

```env
REACT_APP_PAYROLL_MANAGER_MAINNET=0x... # Your mainnet contract address
```

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Set environment variables in Vercel dashboard
# - REACT_APP_WALLETCONNECT_PROJECT_ID
# - REACT_APP_PAYROLL_MANAGER_MAINNET
# - REACT_APP_API_URL
```

### Option 2: Netlify

```bash
# Build the frontend
cd frontend
npm run build

# Deploy to Netlify
# Upload the 'build' folder to Netlify
# Set environment variables in Netlify dashboard
```

### Option 3: Traditional Hosting

```bash
# Build for production
cd frontend
npm run build

# Upload 'build' folder to your web server
# Configure environment variables on your server
```

## 🔧 Backend Deployment

### Option 1: Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy from backend directory
cd backend
railway login
railway init
railway up

# Set environment variables in Railway dashboard
```

### Option 2: Heroku

```bash
# Install Heroku CLI
# Create Procfile in backend directory:
echo "web: node server.js" > Procfile

# Deploy to Heroku
cd backend
heroku create your-app-name
git push heroku main

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
# ... set other variables
```

### Option 3: DigitalOcean App Platform

```bash
# Create app.yaml in backend directory
# Deploy through DigitalOcean dashboard
# Set environment variables in app settings
```

## 🗄️ Database Setup

### MongoDB Atlas (Cloud)

1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables

### Local MongoDB

```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongod

# Create database
mongo
use web3payroll
```

### Redis Setup

#### Redis Cloud (Recommended)

1. Create Redis Cloud account
2. Create new database
3. Get connection string
4. Update `REDIS_URL` in environment variables

#### Local Redis

```bash
# Install Redis
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server

# Start Redis
redis-server
```

## 🔐 Security Configuration

### 1. Environment Variables Security

- Never commit `.env` files to version control
- Use different keys for development and production
- Rotate keys regularly
- Use environment-specific configurations

### 2. Smart Contract Security

```bash
# Run security audit
cd contracts
npm audit

# Use OpenZeppelin security patterns
# Test all functions thoroughly
# Deploy to testnet first
```

### 3. API Security

- Enable CORS for specific domains only
- Use rate limiting
- Implement proper authentication
- Use HTTPS in production
- Validate all inputs

## 📊 Monitoring & Analytics

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install --save @sentry/node @sentry/react

# Configure Sentry for error tracking
# Set up logging with Winston
# Monitor API performance
```

### 2. Blockchain Monitoring

- Monitor contract events
- Track transaction success rates
- Monitor gas usage
- Set up alerts for failed transactions

### 3. Database Monitoring

- Monitor MongoDB performance
- Track query execution times
- Set up database backups
- Monitor Redis cache hit rates

## 🚀 Production Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database backups set up
- [ ] Monitoring configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] CDN set up (optional)

### Post-Deployment

- [ ] Verify all endpoints working
- [ ] Test wallet connections
- [ ] Test contract interactions
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify ENS integration
- [ ] Test payment processing
- [ ] Document any issues

## 🔧 Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails

```bash
# Check gas limits
# Verify private key has sufficient ETH
# Check network connectivity
# Verify contract compilation
```

#### 2. Frontend Connection Issues

```bash
# Check environment variables
# Verify contract addresses
# Check network configuration
# Clear browser cache
```

#### 3. Database Connection Issues

```bash
# Check MongoDB connection string
# Verify database permissions
# Check network connectivity
# Review connection logs
```

#### 4. ENS Integration Issues

```bash
# Verify ENS registry address
# Check resolver configuration
# Test domain availability
# Review ENS service logs
```

### Support

For additional support:

1. Check the logs in each service
2. Review the documentation
3. Test on testnet first
4. Contact the development team

## 📈 Scaling Considerations

### Performance Optimization

- Use Redis for caching
- Implement database indexing
- Optimize smart contract gas usage
- Use CDN for static assets
- Implement pagination for large datasets

### High Availability

- Set up database replication
- Use load balancers
- Implement health checks
- Set up automated backups
- Use multiple RPC providers

### Security Scaling

- Implement rate limiting
- Use API keys for external access
- Set up monitoring and alerting
- Regular security audits
- Keep dependencies updated

---

## 🎉 Congratulations!

You've successfully deployed the Web3 Payroll System! 

**Next Steps:**
1. Register your company ENS domain
2. Add your first employees
3. Test the payroll processing
4. Set up monitoring and alerts
5. Train your team on the system

**Remember:** Always test thoroughly on testnet before using in production with real funds!




