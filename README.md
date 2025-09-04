# 🚀 Web3 Payroll System with ENS Integration

A comprehensive Web3 payroll and bonus management system built on Ethereum with ENS domain integration for human-readable employee addresses.

## 🎯 Features

- **ENS Integration**: Automatic subdomain creation for employees (e.g., `alice.company.eth`)
- **Multi-Token Support**: Pay employees in ETH, USDC, USDT, or DAI
- **Automated Payroll**: Set up recurring payments (weekly, bi-weekly, monthly, quarterly)
- **Bonus Management**: Distribute performance bonuses and one-time payments
- **Modern UI**: Built with React, Material-UI, and RainbowKit for wallet connections
- **Secure Smart Contracts**: Built with OpenZeppelin security patterns

## 🏗️ Project Structure

```
web3-payroll-system/
├── contracts/          # Smart contracts
├── frontend/           # React frontend
├── backend/            # Node.js backend
├── scripts/            # Deployment scripts
└── test/              # Test files
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or compatible wallet
- Ethereum testnet ETH (Sepolia)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd web3-payroll-system
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development servers
```bash
npm run dev
```

## 🛠️ Technology Stack

### Frontend
- React 18 with TypeScript
- Wagmi + RainbowKit for wallet connections
- Material-UI for beautiful components
- ENS.js for domain management

### Backend
- Node.js + Express
- MongoDB for data storage
- Redis for caching

### Smart Contracts
- Solidity 0.8.19
- Hardhat for development
- OpenZeppelin for security

## 📋 Development Checklist

- [x] Project structure setup
- [ ] Smart contract development
- [ ] Frontend components
- [ ] Backend API
- [ ] ENS integration
- [ ] Testing
- [ ] Deployment

## 🎨 Design Principles

- **Clean Architecture**: Separation of concerns with clear interfaces
- **Security First**: Comprehensive security measures throughout
- **User Experience**: Intuitive interface for both technical and non-technical users
- **Web3 Native**: Built specifically for the Ethereum ecosystem

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Dev Austin** - Building the future of decentralized payroll systems

