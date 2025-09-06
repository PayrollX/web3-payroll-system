const { ethers } = require("hardhat");
const hre = require("hardhat");

/**
 * Local deployment script for PayrollManager contract
 * This deploys with mock ENS settings for local testing
 * @author Dev Austin
 */
async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Deploying PayrollManager contract locally...");
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // For local testing, we'll use mock addresses
    // In a real local test, you'd want to deploy ENS contracts first
    const ENS_REGISTRY = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Mock address
    const PUBLIC_RESOLVER = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Mock address
    
    // For testing, we'll use a placeholder company node
    const companyDomain = "testcompany.eth";
    const companyNode = ethers.namehash(companyDomain);
    
    console.log("📋 Local Deployment Configuration:");
    console.log("- ENS Registry (Mock):", ENS_REGISTRY);
    console.log("- Public Resolver (Mock):", PUBLIC_RESOLVER);
    console.log("- Company Domain:", companyDomain);
    console.log("- Company Node:", companyNode);
    
    // Deploy PayrollManager
    const PayrollManager = await ethers.getContractFactory("PayrollManager");
    const payrollManager = await PayrollManager.deploy(
        ENS_REGISTRY,
        companyNode,
        PUBLIC_RESOLVER
    );

    await payrollManager.waitForDeployment();

    console.log("✅ PayrollManager deployed successfully!");
    console.log("Contract address:", await payrollManager.getAddress());
    console.log("Transaction hash:", payrollManager.deploymentTransaction().hash);

    // Save deployment info for local development
    const contractAddress = await payrollManager.getAddress();
    const deploymentInfo = {
        network: hre.network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        ensRegistry: ENS_REGISTRY,
        publicResolver: PUBLIC_RESOLVER,
        companyDomain: companyDomain,
        companyNode: companyNode,
        deploymentTime: new Date().toISOString(),
        transactionHash: payrollManager.deploymentTransaction().hash
    };

    console.log("\n📄 Local Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Write deployment info to file for frontend to use
    const fs = require('fs');
    const path = require('path');
    
    // Create deployment info for frontend
    const frontendDeploymentInfo = {
        chainId: 31337, // Hardhat local network
        contractAddress: contractAddress,
        deployedAt: new Date().toISOString()
    };
    
    // Write to frontend contracts directory
    const frontendContractsDir = path.join(__dirname, '../../frontend/src/contracts');
    const deploymentFilePath = path.join(frontendContractsDir, 'deployment.json');
    
    try {
        fs.writeFileSync(deploymentFilePath, JSON.stringify(frontendDeploymentInfo, null, 2));
        console.log("✅ Deployment info saved to frontend:", deploymentFilePath);
    } catch (error) {
        console.log("⚠️  Could not save deployment info to frontend:", error.message);
    }

    // Instructions for next steps
    console.log("\n🎯 Next Steps for Local Development:");
    console.log("1. Start the backend API server");
    console.log("2. Start the frontend React application");
    console.log("3. Connect MetaMask to http://localhost:8545");
    console.log("4. Import one of the test accounts using private keys shown in Hardhat node");
    console.log("5. Test the contract functions through the UI");
    console.log("\n📝 Test Account (Account #0):");
    console.log("Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    console.log("Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Local deployment failed:", error);
        process.exit(1);
    });


