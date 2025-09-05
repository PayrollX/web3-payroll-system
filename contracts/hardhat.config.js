require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      // Disable forking for local development
      // forking: {
      //   url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      // }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
    mainnet: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') ? [process.env.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gas: "auto"
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') ? [process.env.PRIVATE_KEY] : []
    },
    goerli: {
      url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'your_private_key_here') ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
