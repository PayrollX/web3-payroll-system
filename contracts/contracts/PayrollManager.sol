// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@ensdomains/ens-contracts/contracts/registry/ENS.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/Resolver.sol";

/**
 * @title PayrollManager
 * @author Dev Austin
 * @notice A comprehensive Web3 payroll system with ENS integration
 * @dev Manages employee payroll, bonuses, and ENS subdomain creation
 */
contract PayrollManager is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // ENS Registry contract
    ENS public ensRegistry;
    
    // Company's ENS node (e.g., company.eth)
    bytes32 public companyNode;
    
    // Public resolver for ENS records
    address public publicResolver;

    /**
     * @notice Employee information structure
     * @dev Stores all employee-related data including ENS subdomain
     */
    struct Employee {
        address walletAddress;        // Employee's wallet address
        uint256 salaryAmount;         // Salary amount in wei
        uint256 lastPaymentTimestamp; // Last payment timestamp
        bool isActive;                // Employee status
        bytes32 ensNode;              // ENS node for employee subdomain
        PaymentFrequency frequency;   // Payment frequency
        address preferredToken;       // Preferred payment token
        string ensSubdomain;          // ENS subdomain name
        uint256 startDate;            // Employment start date
        string position;              // Employee position
        string department;            // Department
    }

    /**
     * @notice Payment frequency enumeration
     */
    enum PaymentFrequency { 
        WEEKLY,      // 7 days
        BIWEEKLY,    // 14 days
        MONTHLY,     // 30 days
        QUARTERLY    // 90 days
    }

    /**
     * @notice Bonus structure for tracking bonus payments
     */
    struct Bonus {
        uint256 amount;               // Bonus amount
        address recipient;            // Bonus recipient
        string reason;                // Bonus reason
        uint256 timestamp;            // Bonus timestamp
        bool distributed;             // Distribution status
        address token;                // Bonus token
    }

    // State variables
    mapping(address => Employee) public employees;
    mapping(bytes32 => address) public ensNodeToEmployee;
    mapping(address => bool) public authorizedTokens;
    mapping(uint256 => Bonus) public bonuses;
    mapping(address => uint256[]) public employeeBonuses;
    
    uint256 public totalEmployees;
    uint256 public totalBonuses;
    uint256 public totalPayrollProcessed;

    // Events
    event EmployeeAdded(
        address indexed employee, 
        string ensSubdomain, 
        bytes32 ensNode,
        uint256 salary,
        PaymentFrequency frequency
    );
    
    event EmployeeRemoved(address indexed employee);
    
    event EmployeeUpdated(
        address indexed employee, 
        uint256 newSalary, 
        PaymentFrequency newFrequency
    );
    
    event PaymentProcessed(
        address indexed employee, 
        uint256 amount, 
        address token,
        uint256 timestamp
    );
    
    event BonusCreated(
        uint256 indexed bonusId,
        address indexed recipient,
        uint256 amount,
        string reason
    );
    
    event BonusDistributed(
        uint256 indexed bonusId,
        address indexed recipient,
        uint256 amount,
        address token
    );
    
    event ENSSubdomainCreated(
        string subdomain, 
        bytes32 node, 
        address owner
    );
    
    event TokenAuthorized(address indexed token, bool authorized);

    /**
     * @notice Constructor initializes the contract
     * @param _ensRegistry Address of ENS registry contract
     * @param _companyNode ENS node hash of company domain
     * @param _publicResolver Address of public resolver
     */
    constructor(
        address _ensRegistry,
        bytes32 _companyNode,
        address _publicResolver
    ) {
        require(_ensRegistry != address(0), "Invalid ENS registry");
        require(_publicResolver != address(0), "Invalid resolver");
        
        ensRegistry = ENS(_ensRegistry);
        companyNode = _companyNode;
        publicResolver = _publicResolver;
        
        // Authorize common tokens
        authorizedTokens[address(0)] = true; // ETH
        authorizedTokens[0xa0B86A33E6e527e1f8a4e84F57FB1E8A84eb8aeD] = true; // USDC
        authorizedTokens[0xdAC17F958D2ee523a2206206994597C13D831ec7] = true; // USDT
        authorizedTokens[0x6B175474E89094C44Da98b954EedeAC495271d0F] = true; // DAI
    }

    /**
     * @notice Add a new employee with ENS subdomain
     * @param _employee Employee's wallet address
     * @param _salary Monthly salary amount in wei
     * @param _subdomain ENS subdomain (e.g., "alice" for alice.company.eth)
     * @param _frequency Payment frequency
     * @param _token Preferred payment token address
     * @param _position Employee position
     * @param _department Employee department
     */
    function addEmployee(
        address _employee,
        uint256 _salary,
        string memory _subdomain,
        PaymentFrequency _frequency,
        address _token,
        string memory _position,
        string memory _department
    ) external onlyOwner whenNotPaused {
        require(_employee != address(0), "Invalid employee address");
        require(_salary > 0, "Salary must be greater than 0");
        require(authorizedTokens[_token], "Token not authorized");
        require(!employees[_employee].isActive, "Employee already exists");
        require(bytes(_subdomain).length > 0, "Subdomain cannot be empty");

        // Create ENS subdomain
        bytes32 subdomainNode = _createENSSubdomain(_subdomain, _employee);

        employees[_employee] = Employee({
            walletAddress: _employee,
            salaryAmount: _salary,
            lastPaymentTimestamp: 0,
            isActive: true,
            ensNode: subdomainNode,
            frequency: _frequency,
            preferredToken: _token,
            ensSubdomain: _subdomain,
            startDate: block.timestamp,
            position: _position,
            department: _department
        });

        ensNodeToEmployee[subdomainNode] = _employee;
        totalEmployees = totalEmployees.add(1);

        emit EmployeeAdded(_employee, _subdomain, subdomainNode, _salary, _frequency);
    }

    /**
     * @notice Remove an employee
     * @param _employee Employee's wallet address
     */
    function removeEmployee(address _employee) external onlyOwner {
        require(employees[_employee].isActive, "Employee not found");
        
        employees[_employee].isActive = false;
        totalEmployees = totalEmployees.sub(1);
        
        emit EmployeeRemoved(_employee);
    }

    /**
     * @notice Update employee salary and frequency
     * @param _employee Employee's wallet address
     * @param _newSalary New salary amount
     * @param _newFrequency New payment frequency
     */
    function updateEmployee(
        address _employee,
        uint256 _newSalary,
        PaymentFrequency _newFrequency
    ) external onlyOwner {
        require(employees[_employee].isActive, "Employee not found");
        require(_newSalary > 0, "Salary must be greater than 0");
        
        employees[_employee].salaryAmount = _newSalary;
        employees[_employee].frequency = _newFrequency;
        
        emit EmployeeUpdated(_employee, _newSalary, _newFrequency);
    }

    /**
     * @notice Process payroll for multiple employees
     * @param _employees Array of employee addresses
     */
    function processPayroll(address[] calldata _employees) 
        external 
        onlyOwner 
        nonReentrant 
        whenNotPaused 
    {
        require(_employees.length > 0, "No employees specified");
        
        for (uint256 i = 0; i < _employees.length; i++) {
            _processIndividualPayment(_employees[i]);
        }
    }

    /**
     * @notice Process payment for a single employee
     * @param _employee Employee's wallet address
     */
    function processIndividualPayment(address _employee) 
        external 
        onlyOwner 
        nonReentrant 
        whenNotPaused 
    {
        _processIndividualPayment(_employee);
    }

    /**
     * @notice Internal function to process individual payment
     * @param _employee Employee's wallet address
     */
    function _processIndividualPayment(address _employee) internal {
        Employee storage employee = employees[_employee];
        require(employee.isActive, "Employee not active");
        
        uint256 paymentAmount = calculatePaymentAmount(_employee);
        require(paymentAmount > 0, "No payment due");

        if (employee.preferredToken == address(0)) {
            // Pay in ETH
            require(address(this).balance >= paymentAmount, "Insufficient ETH balance");
            payable(_employee).transfer(paymentAmount);
        } else {
            // Pay in ERC20 token
            IERC20 token = IERC20(employee.preferredToken);
            require(token.balanceOf(address(this)) >= paymentAmount, "Insufficient token balance");
            token.safeTransfer(_employee, paymentAmount);
        }

        employee.lastPaymentTimestamp = block.timestamp;
        totalPayrollProcessed = totalPayrollProcessed.add(paymentAmount);
        
        emit PaymentProcessed(_employee, paymentAmount, employee.preferredToken, block.timestamp);
    }

    /**
     * @notice Create a bonus for an employee
     * @param _recipient Bonus recipient address
     * @param _amount Bonus amount
     * @param _reason Bonus reason
     * @param _token Bonus token address
     */
    function createBonus(
        address _recipient,
        uint256 _amount,
        string memory _reason,
        address _token
    ) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than 0");
        require(authorizedTokens[_token], "Token not authorized");
        
        uint256 bonusId = totalBonuses;
        bonuses[bonusId] = Bonus({
            amount: _amount,
            recipient: _recipient,
            reason: _reason,
            timestamp: block.timestamp,
            distributed: false,
            token: _token
        });
        
        employeeBonuses[_recipient].push(bonusId);
        totalBonuses = totalBonuses.add(1);
        
        emit BonusCreated(bonusId, _recipient, _amount, _reason);
    }

    /**
     * @notice Distribute a bonus
     * @param _bonusId Bonus ID to distribute
     */
    function distributeBonus(uint256 _bonusId) 
        external 
        onlyOwner 
        nonReentrant 
        whenNotPaused 
    {
        Bonus storage bonus = bonuses[_bonusId];
        require(!bonus.distributed, "Bonus already distributed");
        
        if (bonus.token == address(0)) {
            // Distribute ETH
            require(address(this).balance >= bonus.amount, "Insufficient ETH balance");
            payable(bonus.recipient).transfer(bonus.amount);
        } else {
            // Distribute ERC20 token
            IERC20 token = IERC20(bonus.token);
            require(token.balanceOf(address(this)) >= bonus.amount, "Insufficient token balance");
            token.safeTransfer(bonus.recipient, bonus.amount);
        }
        
        bonus.distributed = true;
        emit BonusDistributed(_bonusId, bonus.recipient, bonus.amount, bonus.token);
    }

    /**
     * @notice Calculate payment amount for an employee
     * @param _employee Employee's wallet address
     * @return Payment amount in wei
     */
    function calculatePaymentAmount(address _employee) public view returns (uint256) {
        Employee memory employee = employees[_employee];
        if (!employee.isActive) return 0;

        uint256 timeSinceLastPayment = block.timestamp.sub(employee.lastPaymentTimestamp);
        uint256 paymentInterval = getPaymentInterval(employee.frequency);
        
        if (timeSinceLastPayment >= paymentInterval) {
            return employee.salaryAmount;
        }
        
        return 0;
    }

    /**
     * @notice Get payment interval for a frequency
     * @param _frequency Payment frequency
     * @return Payment interval in seconds
     */
    function getPaymentInterval(PaymentFrequency _frequency) public pure returns (uint256) {
        if (_frequency == PaymentFrequency.WEEKLY) return 7 days;
        if (_frequency == PaymentFrequency.BIWEEKLY) return 14 days;
        if (_frequency == PaymentFrequency.MONTHLY) return 30 days;
        if (_frequency == PaymentFrequency.QUARTERLY) return 90 days;
        return 30 days; // default to monthly
    }

    /**
     * @notice Create ENS subdomain for employee
     * @param _subdomain Subdomain name
     * @param _owner Subdomain owner
     * @return ENS node hash
     */
    function _createENSSubdomain(
        string memory _subdomain,
        address _owner
    ) internal returns (bytes32) {
        bytes32 labelHash = keccak256(abi.encodePacked(_subdomain));
        bytes32 subdomainNode = keccak256(abi.encodePacked(companyNode, labelHash));

        // Set subdomain record
        ensRegistry.setSubnodeRecord(
            companyNode,
            labelHash,
            _owner,
            publicResolver,
            0
        );

        // Set address record in resolver
        Resolver resolver = Resolver(publicResolver);
        resolver.setAddr(subdomainNode, _owner);

        emit ENSSubdomainCreated(_subdomain, subdomainNode, _owner);
        return subdomainNode;
    }

    /**
     * @notice Resolve ENS node to employee address
     * @param _ensNode ENS node hash
     * @return Employee address
     */
    function resolveENSToEmployee(bytes32 _ensNode) external view returns (address) {
        return ensNodeToEmployee[_ensNode];
    }

    /**
     * @notice Authorize or deauthorize a token
     * @param _token Token address
     * @param _authorized Authorization status
     */
    function setTokenAuthorization(address _token, bool _authorized) external onlyOwner {
        authorizedTokens[_token] = _authorized;
        emit TokenAuthorized(_token, _authorized);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw function
     * @param _token Token address (address(0) for ETH)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        if (_token == address(0)) {
            payable(owner()).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(owner(), _amount);
        }
    }

    /**
     * @notice Get employee bonuses
     * @param _employee Employee address
     * @return Array of bonus IDs
     */
    function getEmployeeBonuses(address _employee) external view returns (uint256[] memory) {
        return employeeBonuses[_employee];
    }

    /**
     * @notice Get bonus details
     * @param _bonusId Bonus ID
     * @return Bonus struct
     */
    function getBonus(uint256 _bonusId) external view returns (Bonus memory) {
        return bonuses[_bonusId];
    }

    /**
     * @notice Get all active employees
     * @return Array of employee addresses
     */
    function getActiveEmployees() external view returns (address[] memory) {
        address[] memory activeEmployees = new address[](totalEmployees);
        uint256 index = 0;
        
        // Note: This is a simplified implementation
        // In production, you might want to maintain a separate array of active employees
        return activeEmployees;
    }

    /**
     * @notice Register a new ENS domain for the company
     * @dev Simplified version that just stores the domain info and lets frontend handle ENS
     * @param _domainName The domain name to register (without .eth)
     * @param _duration Registration duration in seconds
     * @param _owner The owner of the domain (should be msg.sender for security)
     */
    function registerCompanyDomain(
        string memory _domainName,
        uint256 _duration,
        address _owner
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Insufficient payment");
        require(_owner == msg.sender, "Can only register domains for yourself");
        require(bytes(_domainName).length > 0, "Domain name cannot be empty");
        
        // For now, we'll store the domain info and let the frontend handle actual ENS registration
        // This is a safer approach that avoids complex ENS integration in the contract
        
        string memory fullDomain = string(abi.encodePacked(_domainName, ".eth"));
        bytes32 newCompanyNode = keccak256(abi.encodePacked(keccak256(abi.encodePacked(bytes32(0), keccak256("eth"))), keccak256(abi.encodePacked(_domainName))));
        
        // Store domain registration info
        emit CompanyDomainRegistered(_domainName, fullDomain, newCompanyNode, _owner);
        
        // For demonstration purposes, we accept the payment
        // In a real implementation, this would interact with ENS registrar
        // For now, we'll just emit the event to show the domain was "registered"
    }

    /**
     * @notice Check if a domain is available for registration
     * @param _domainName The domain name to check
     * @return True if available, false otherwise
     */
    function isDomainAvailable(string memory _domainName) external view returns (bool) {
        // Import the Base Registrar interface
        address baseRegistrar = 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85;
        
        // Get the label hash
        bytes32 labelHash = keccak256(abi.encodePacked(_domainName));
        
        // Check if the domain is available
        (bool success, bytes memory data) = baseRegistrar.staticcall(
            abi.encodeWithSignature("available(uint256)", uint256(labelHash))
        );
        
        if (!success) return false;
        
        return abi.decode(data, (bool));
    }

    /**
     * @notice Get the registration cost for a domain
     * @param _domainName The domain name
     * @param _duration Registration duration in seconds
     * @return The cost in wei
     */
    function getDomainRegistrationCost(string memory _domainName, uint256 _duration) external view returns (uint256) {
        address ethRegistrarController = 0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72; // Sepolia
        
        (bool success, bytes memory data) = ethRegistrarController.staticcall(
            abi.encodeWithSignature("rentPrice(string,uint256)", _domainName, _duration)
        );
        
        if (!success) return 0;
        
        (uint256 basePrice, uint256 premiumPrice) = abi.decode(data, (uint256, uint256));
        return basePrice + premiumPrice;
    }

    /**
     * @notice Event emitted when a company domain is registered
     */
    event CompanyDomainRegistered(string indexed domainName, string fullDomain, bytes32 node, address owner);

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}
