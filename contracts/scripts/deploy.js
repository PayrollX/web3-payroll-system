const { ethers } = require("hardhat");
const hre = require("hardhat");

/**
 * Deployment script for PayrollManager contract
 * @author Dev Austin
 */
async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Deploying PayrollManager contract...");
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

    // ENS Registry on Ethereum Mainnet
    const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    const PUBLIC_RESOLVER = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41";
    
    // For testing, we'll use a placeholder company node
    // In production, this should be the actual company domain node
    const companyDomain = "testcompany.eth"; // Replace with actual domain
    const companyNode = ethers.namehash(companyDomain);
    
    console.log("📋 Deployment Configuration:");
    console.log("- ENS Registry:", ENS_REGISTRY);
    console.log("- Public Resolver:", PUBLIC_RESOLVER);
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

    // Verify on Etherscan if not on hardhat network
    if (hre.network.name !== "hardhat") {
        console.log("⏳ Waiting for block confirmations...");
        await payrollManager.deploymentTransaction().wait(6);
        
        try {
            console.log("🔍 Verifying contract on Etherscan...");
            await hre.run("verify:verify", {
                address: await payrollManager.getAddress(),
                constructorArguments: [ENS_REGISTRY, companyNode, PUBLIC_RESOLVER],
            });
            console.log("✅ Contract verified successfully!");
        } catch (error) {
            console.log("❌ Verification failed:", error.message);
        }
    }

    // Save deployment info
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

    console.log("\n📄 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Instructions for next steps
    console.log("\n🎯 Next Steps:");
    console.log("1. Update frontend with contract address:", contractAddress);
    console.log("2. Register your company ENS domain:", companyDomain);
    console.log("3. Fund the contract with ETH and tokens for payroll");
    console.log("4. Test the contract functions on testnet first");
    console.log("5. Add your first employee to test the system");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
