# 🚀 Sepolia Testnet Setup Guide

Your Web3 Payroll System has been configured to use **Sepolia Testnet** as the default network. This guide will help you set up everything needed to run the system on Sepolia.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** (running locally or cloud instance)
3. **Sepolia ETH** (for gas fees)
4. **API Keys** (Alchemy/Infura for RPC access)

## 🔧 Environment Setup

### 1. Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:3001

# WalletConnect Configuration
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Sepolia RPC Configuration
REACT_APP_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_project_id

# Contract Addresses (update after deployment)
REACT_APP_PAYROLL_MANAGER_SEPOLIA=0x0000000000000000000000000000000000000000
```

### 2. Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/web3-payroll

# Blockchain Configuration
ALCHEMY_API_KEY=your_alchemy_api_key_here
INFURA_PROJECT_ID=your_infura_project_id_here

# Sepolia Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_api_key

# Security
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:3000
```

## 🔑 Getting Required API Keys

### 1. Alchemy API Key
1. Go to [Alchemy.com](https://www.alchemy.com/)
2. Create an account and new app
3. Select "Ethereum" and "Sepolia" network
4. Copy your API key

### 2. Infura Project ID
1. Go to [Infura.io](https://infura.io/)
2. Create an account and new project
3. Select "Ethereum" and "Sepolia" network
4. Copy your project ID

### 3. WalletConnect Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Create a new project
3. Copy your project ID

## 💰 Getting Sepolia ETH

You'll need Sepolia ETH for gas fees. Get it from these faucets:

1. **[Sepolia Faucet](https://sepoliafaucet.com/)** - 0.5 ETH per day
2. **[Alchemy Faucet](https://sepoliafaucet.com/)** - 0.5 ETH per day
3. **[Chainlink Faucet](https://faucets.chain.link/sepolia)** - 0.1 ETH per day
4. **[Sepolia Faucet](https://faucet.sepolia.dev/)** - 0.5 ETH per day

## 🚀 Deployment Steps

### 1. Deploy Smart Contracts to Sepolia

```bash
cd contracts

# Install dependencies
npm install

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Update Contract Addresses

After deployment, update the contract addresses in your `.env` files:

```bash
# Frontend .env
REACT_APP_PAYROLL_MANAGER_SEPOLIA=0x[deployed_contract_address]

# Backend .env
PAYROLL_MANAGER_SEPOLIA=0x[deployed_contract_address]
```

### 3. Start the Backend

```bash
cd backend
npm install
npm start
```

### 4. Start the Frontend

```bash
cd frontend
npm install
npm start
```

## 🌐 Network Configuration

The system is now configured to:

- **Default Network**: Sepolia Testnet (Chain ID: 11155111)
- **RPC Provider**: Your configured Alchemy/Infura endpoint
- **ENS Registry**: Real ENS contracts on Sepolia
- **Token Support**: ETH and Sepolia USDC

## 🔍 Testing the Setup

### 1. Connect Wallet
1. Open the frontend at `http://localhost:3000`
2. Click "Connect Wallet"
3. Select MetaMask or your preferred wallet
4. Switch to Sepolia network if prompted

### 2. Verify Network
- The dashboard should show "Sepolia Testnet" in the network status
- Contract balance should show real Sepolia ETH balance
- All blockchain interactions will use Sepolia

### 3. Test ENS Functionality
- Try registering a company domain
- Check domain availability (real ENS checking)
- Create employee subdomains

## 🐛 Troubleshooting

### Common Issues

1. **"Wrong Network" Error**
   - Ensure your wallet is connected to Sepolia
   - Check that the RPC URL is correct

2. **"Insufficient Funds" Error**
   - Get more Sepolia ETH from faucets
   - Check your wallet balance

3. **"Contract Not Deployed" Error**
   - Verify contract deployment was successful
   - Check contract address in environment variables

4. **"RPC Error" Issues**
   - Verify your Alchemy/Infura API key
   - Check rate limits on your API provider

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=web3-payroll:*
```

## 📊 What's Different from Local Development

| Feature | Local (Hardhat) | Sepolia |
|---------|----------------|---------|
| **Network** | Local blockchain | Real testnet |
| **ETH** | Unlimited test ETH | Limited faucet ETH |
| **ENS** | Simulated | Real ENS contracts |
| **Gas Fees** | Free | Real gas fees |
| **Persistence** | Resets on restart | Permanent |
| **Speed** | Instant | ~15 seconds per block |

## 🎯 Next Steps

1. **Deploy Contracts**: Deploy your payroll contracts to Sepolia
2. **Test Features**: Test all payroll functionality with real testnet
3. **Get Test Tokens**: Acquire Sepolia USDC for testing
4. **ENS Registration**: Register real ENS domains for testing
5. **Production Ready**: Once tested, deploy to mainnet

## 🔗 Useful Links

- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Sepolia Faucets](https://sepoliafaucet.com/)
- [ENS on Sepolia](https://app.ens.domains/)
- [Alchemy Sepolia](https://dashboard.alchemy.com/)
- [Infura Sepolia](https://infura.io/)

---

**🎉 Congratulations!** Your Web3 Payroll System is now configured for Sepolia testnet. You can now test all features with real blockchain interactions while using testnet ETH.
