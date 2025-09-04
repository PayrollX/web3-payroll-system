const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Comprehensive test suite for PayrollManager contract
 * @author Dev Austin
 */
describe("PayrollManager", function () {
    let payrollManager;
    let owner, employee1, employee2, unauthorized;
    let mockENS, mockResolver;
    
    // Test constants
    const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    const PUBLIC_RESOLVER = "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41";
    const USDC_ADDRESS = "0xA0b86a33E6e527e1F8A4E84F57FB1e8A84eB8aEd";
    const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    
    const companyDomain = "testcompany.eth";
    const companyNode = ethers.utils.namehash(companyDomain);
    
    const MONTHLY_SALARY = ethers.utils.parseEther("1.0"); // 1 ETH
    const WEEKLY_SALARY = ethers.utils.parseEther("0.25"); // 0.25 ETH

    beforeEach(async function () {
        [owner, employee1, employee2, unauthorized] = await ethers.getSigners();
        
        // Deploy PayrollManager
        const PayrollManager = await ethers.getContractFactory("PayrollManager");
        payrollManager = await PayrollManager.deploy(
            ENS_REGISTRY,
            companyNode,
            PUBLIC_RESOLVER
        );
        await payrollManager.deployed();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await payrollManager.owner()).to.equal(owner.address);
        });

        it("Should set the correct ENS registry", async function () {
            expect(await payrollManager.ensRegistry()).to.equal(ENS_REGISTRY);
        });

        it("Should set the correct company node", async function () {
            expect(await payrollManager.companyNode()).to.equal(companyNode);
        });

        it("Should authorize common tokens", async function () {
            expect(await payrollManager.authorizedTokens(ethers.constants.AddressZero)).to.be.true; // ETH
            expect(await payrollManager.authorizedTokens(USDC_ADDRESS)).to.be.true; // USDC
            expect(await payrollManager.authorizedTokens(USDT_ADDRESS)).to.be.true; // USDT
            expect(await payrollManager.authorizedTokens(DAI_ADDRESS)).to.be.true; // DAI
        });

        it("Should initialize with zero employees", async function () {
            expect(await payrollManager.totalEmployees()).to.equal(0);
        });
    });

    describe("Employee Management", function () {
        it("Should add employee successfully", async function () {
            await expect(
                payrollManager.addEmployee(
                    employee1.address,
                    MONTHLY_SALARY,
                    "alice",
                    2, // MONTHLY
                    ethers.constants.AddressZero, // ETH
                    "Software Engineer",
                    "Engineering"
                )
            ).to.emit(payrollManager, "EmployeeAdded")
            .withArgs(employee1.address, "alice", anyValue, MONTHLY_SALARY, 2);

            const employee = await payrollManager.employees(employee1.address);
            expect(employee.walletAddress).to.equal(employee1.address);
            expect(employee.salaryAmount).to.equal(MONTHLY_SALARY);
            expect(employee.isActive).to.be.true;
            expect(employee.ensSubdomain).to.equal("alice");
            expect(employee.frequency).to.equal(2); // MONTHLY
            expect(employee.preferredToken).to.equal(ethers.constants.AddressZero);
            expect(employee.position).to.equal("Software Engineer");
            expect(employee.department).to.equal("Engineering");

            expect(await payrollManager.totalEmployees()).to.equal(1);
        });

        it("Should not allow adding employee with zero salary", async function () {
            await expect(
                payrollManager.addEmployee(
                    employee1.address,
                    0,
                    "alice",
                    2,
                    ethers.constants.AddressZero,
                    "Engineer",
                    "Engineering"
                )
            ).to.be.revertedWith("Salary must be greater than 0");
        });

        it("Should not allow adding employee with unauthorized token", async function () {
            await expect(
                payrollManager.addEmployee(
                    employee1.address,
                    MONTHLY_SALARY,
                    "alice",
                    2,
                    unauthorized.address, // Unauthorized token
                    "Engineer",
                    "Engineering"
                )
            ).to.be.revertedWith("Token not authorized");
        });

        it("Should not allow adding duplicate employee", async function () {
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            await expect(
                payrollManager.addEmployee(
                    employee1.address,
                    MONTHLY_SALARY,
                    "alice2",
                    2,
                    ethers.constants.AddressZero,
                    "Engineer",
                    "Engineering"
                )
            ).to.be.revertedWith("Employee already exists");
        });

        it("Should not allow non-owner to add employee", async function () {
            await expect(
                payrollManager.connect(unauthorized).addEmployee(
                    employee1.address,
                    MONTHLY_SALARY,
                    "alice",
                    2,
                    ethers.constants.AddressZero,
                    "Engineer",
                    "Engineering"
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("Should remove employee successfully", async function () {
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            await expect(payrollManager.removeEmployee(employee1.address))
                .to.emit(payrollManager, "EmployeeRemoved")
                .withArgs(employee1.address);

            const employee = await payrollManager.employees(employee1.address);
            expect(employee.isActive).to.be.false;
            expect(await payrollManager.totalEmployees()).to.equal(0);
        });

        it("Should update employee successfully", async function () {
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            const newSalary = ethers.utils.parseEther("2.0");
            await expect(
                payrollManager.updateEmployee(employee1.address, newSalary, 0) // WEEKLY
            ).to.emit(payrollManager, "EmployeeUpdated")
            .withArgs(employee1.address, newSalary, 0);

            const employee = await payrollManager.employees(employee1.address);
            expect(employee.salaryAmount).to.equal(newSalary);
            expect(employee.frequency).to.equal(0); // WEEKLY
        });
    });

    describe("Payment Processing", function () {
        beforeEach(async function () {
            // Add employee and fund contract
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2, // MONTHLY
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            // Fund contract with ETH
            await owner.sendTransaction({
                to: payrollManager.address,
                value: ethers.utils.parseEther("10")
            });
        });

        it("Should calculate payment amount correctly", async function () {
            const paymentAmount = await payrollManager.calculatePaymentAmount(employee1.address);
            expect(paymentAmount).to.equal(MONTHLY_SALARY);
        });

        it("Should process individual payment successfully", async function () {
            const initialBalance = await employee1.getBalance();
            
            await expect(payrollManager.processIndividualPayment(employee1.address))
                .to.emit(payrollManager, "PaymentProcessed")
                .withArgs(employee1.address, MONTHLY_SALARY, ethers.constants.AddressZero, anyValue);

            const finalBalance = await employee1.getBalance();
            expect(finalBalance.sub(initialBalance)).to.equal(MONTHLY_SALARY);
        });

        it("Should process batch payments successfully", async function () {
            // Add second employee
            await payrollManager.addEmployee(
                employee2.address,
                MONTHLY_SALARY,
                "bob",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            const initialBalance1 = await employee1.getBalance();
            const initialBalance2 = await employee2.getBalance();

            await payrollManager.processPayroll([employee1.address, employee2.address]);

            const finalBalance1 = await employee1.getBalance();
            const finalBalance2 = await employee2.getBalance();

            expect(finalBalance1.sub(initialBalance1)).to.equal(MONTHLY_SALARY);
            expect(finalBalance2.sub(initialBalance2)).to.equal(MONTHLY_SALARY);
        });

        it("Should not process payment if insufficient funds", async function () {
            // Create new contract with no funds
            const PayrollManager = await ethers.getContractFactory("PayrollManager");
            const emptyPayroll = await PayrollManager.deploy(
                ENS_REGISTRY,
                companyNode,
                PUBLIC_RESOLVER
            );
            await emptyPayroll.deployed();

            await emptyPayroll.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            await expect(
                emptyPayroll.processIndividualPayment(employee1.address)
            ).to.be.revertedWith("Insufficient ETH balance");
        });

        it("Should not process payment for inactive employee", async function () {
            await payrollManager.removeEmployee(employee1.address);

            await expect(
                payrollManager.processIndividualPayment(employee1.address)
            ).to.be.revertedWith("Employee not active");
        });
    });

    describe("Bonus Management", function () {
        beforeEach(async function () {
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );
        });

        it("Should create bonus successfully", async function () {
            const bonusAmount = ethers.utils.parseEther("0.5");
            
            await expect(
                payrollManager.createBonus(
                    employee1.address,
                    bonusAmount,
                    "Performance bonus",
                    ethers.constants.AddressZero
                )
            ).to.emit(payrollManager, "BonusCreated")
            .withArgs(0, employee1.address, bonusAmount, "Performance bonus");

            const bonus = await payrollManager.getBonus(0);
            expect(bonus.amount).to.equal(bonusAmount);
            expect(bonus.recipient).to.equal(employee1.address);
            expect(bonus.reason).to.equal("Performance bonus");
            expect(bonus.distributed).to.be.false;
            expect(bonus.token).to.equal(ethers.constants.AddressZero);

            expect(await payrollManager.totalBonuses()).to.equal(1);
        });

        it("Should distribute bonus successfully", async function () {
            const bonusAmount = ethers.utils.parseEther("0.5");
            
            await payrollManager.createBonus(
                employee1.address,
                bonusAmount,
                "Performance bonus",
                ethers.constants.AddressZero
            );

            // Fund contract
            await owner.sendTransaction({
                to: payrollManager.address,
                value: bonusAmount
            });

            const initialBalance = await employee1.getBalance();

            await expect(payrollManager.distributeBonus(0))
                .to.emit(payrollManager, "BonusDistributed")
                .withArgs(0, employee1.address, bonusAmount, ethers.constants.AddressZero);

            const finalBalance = await employee1.getBalance();
            expect(finalBalance.sub(initialBalance)).to.equal(bonusAmount);

            const bonus = await payrollManager.getBonus(0);
            expect(bonus.distributed).to.be.true;
        });

        it("Should not distribute bonus twice", async function () {
            const bonusAmount = ethers.utils.parseEther("0.5");
            
            await payrollManager.createBonus(
                employee1.address,
                bonusAmount,
                "Performance bonus",
                ethers.constants.AddressZero
            );

            await owner.sendTransaction({
                to: payrollManager.address,
                value: bonusAmount
            });

            await payrollManager.distributeBonus(0);

            await expect(
                payrollManager.distributeBonus(0)
            ).to.be.revertedWith("Bonus already distributed");
        });
    });

    describe("Payment Frequency", function () {
        it("Should return correct payment intervals", async function () {
            expect(await payrollManager.getPaymentInterval(0)).to.equal(7 * 24 * 60 * 60); // WEEKLY
            expect(await payrollManager.getPaymentInterval(1)).to.equal(14 * 24 * 60 * 60); // BIWEEKLY
            expect(await payrollManager.getPaymentInterval(2)).to.equal(30 * 24 * 60 * 60); // MONTHLY
            expect(await payrollManager.getPaymentInterval(3)).to.equal(90 * 24 * 60 * 60); // QUARTERLY
        });
    });

    describe("Token Authorization", function () {
        it("Should authorize new token", async function () {
            const newToken = ethers.Wallet.createRandom().address;
            
            await expect(payrollManager.setTokenAuthorization(newToken, true))
                .to.emit(payrollManager, "TokenAuthorized")
                .withArgs(newToken, true);

            expect(await payrollManager.authorizedTokens(newToken)).to.be.true;
        });

        it("Should deauthorize token", async function () {
            await expect(payrollManager.setTokenAuthorization(USDC_ADDRESS, false))
                .to.emit(payrollManager, "TokenAuthorized")
                .withArgs(USDC_ADDRESS, false);

            expect(await payrollManager.authorizedTokens(USDC_ADDRESS)).to.be.false;
        });
    });

    describe("Pause Functionality", function () {
        it("Should pause contract", async function () {
            await payrollManager.pause();
            expect(await payrollManager.paused()).to.be.true;
        });

        it("Should unpause contract", async function () {
            await payrollManager.pause();
            await payrollManager.unpause();
            expect(await payrollManager.paused()).to.be.false;
        });

        it("Should not allow operations when paused", async function () {
            await payrollManager.pause();

            await expect(
                payrollManager.addEmployee(
                    employee1.address,
                    MONTHLY_SALARY,
                    "alice",
                    2,
                    ethers.constants.AddressZero,
                    "Engineer",
                    "Engineering"
                )
            ).to.be.revertedWith("Pausable: paused");
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow emergency withdraw of ETH", async function () {
            const withdrawAmount = ethers.utils.parseEther("1.0");
            
            await owner.sendTransaction({
                to: payrollManager.address,
                value: withdrawAmount
            });

            const initialBalance = await owner.getBalance();
            await payrollManager.emergencyWithdraw(ethers.constants.AddressZero, withdrawAmount);
            const finalBalance = await owner.getBalance();

            expect(finalBalance.sub(initialBalance)).to.equal(withdrawAmount);
        });

        it("Should not allow non-owner to emergency withdraw", async function () {
            await expect(
                payrollManager.connect(unauthorized).emergencyWithdraw(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("1.0")
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("ENS Integration", function () {
        it("Should resolve ENS node to employee", async function () {
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            const employee = await payrollManager.employees(employee1.address);
            const resolvedEmployee = await payrollManager.resolveENSToEmployee(employee.ensNode);
            
            expect(resolvedEmployee).to.equal(employee1.address);
        });
    });

    describe("Employee Bonuses", function () {
        it("Should track employee bonuses", async function () {
            await payrollManager.addEmployee(
                employee1.address,
                MONTHLY_SALARY,
                "alice",
                2,
                ethers.constants.AddressZero,
                "Engineer",
                "Engineering"
            );

            // Create multiple bonuses
            await payrollManager.createBonus(
                employee1.address,
                ethers.utils.parseEther("0.5"),
                "Q1 Bonus",
                ethers.constants.AddressZero
            );

            await payrollManager.createBonus(
                employee1.address,
                ethers.utils.parseEther("0.3"),
                "Q2 Bonus",
                ethers.constants.AddressZero
            );

            const bonuses = await payrollManager.getEmployeeBonuses(employee1.address);
            expect(bonuses.length).to.equal(2);
            expect(bonuses[0]).to.equal(0);
            expect(bonuses[1]).to.equal(1);
        });
    });
});

// Helper function for anyValue matcher
function anyValue() {
    return true;
}

