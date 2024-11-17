// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256);
}

interface IChronicleReader {
    function readPrice(uint256 chroniclesPairIndex) external view returns (uint256 val, uint256 age);
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}



interface IChainlinkOracle {
    function latestRoundData() external  view returns( uint80,  int256,  uint256,  uint256,  uint80);
    function getRoundData(uint roundid) external  view  returns(uint80, int256,  uint256,  uint256,  uint80);
    function latestRound()external  view  returns(uint256);
}


contract StopLoss {

    address public owner;
    address public chronicleReader;
    address public chainlinkoracle;
    // Mapping to store the ERC20 token addresses for each user
    mapping(address => address[]) public userToERC20Address;
    
    // Mapping to store the threshold percentages for each token for each user
    mapping(address => uint256[]) public userToERC20AddressThresholdPercentage;

    // List of all users who have configured tokens
    address[] public user_list;


    uint groupId;
    // Struct to store details of stop-loss executions
    struct StoplossExecutedDetails {
        address erc20;          // Address of the ERC20 token
        uint256 timestamp;      // Timestamp of the execution
        uint256 price;          // Execution price
    }

    // Mapping: address -> uint -> array of StoplossExecutedDetails
    mapping(address => mapping(uint256 => StoplossExecutedDetails[])) public stoplossRecords;
    mapping (address => uint[]) public address_to_group_id;
    
     modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    bool useChainlink;bool useChronicle;

    constructor(address _SWAP_ROUTER,address _chronicle,address _chainlinkoracle,bool _useChronicle,bool _useChainlink) {
        owner = msg.sender;
        SWAP_ROUTER = _SWAP_ROUTER;
        chronicleReader = _chronicle;
        chainlinkoracle = _chainlinkoracle;
        useChronicle = _useChronicle;
        useChainlink = _useChainlink;
    }

    function getTokenAndThresholdList(address user) external view returns (address[] memory tokens, uint256[] memory thresholds) {
        return (userToERC20Address[user], userToERC20AddressThresholdPercentage[user]);
    }

    /**
     * @dev Allows a user to configure their ERC20 tokens and threshold percentages.
     * @param tokenAddresses An array of ERC20 token addresses to configure.
     * @param thresholds An array of corresponding threshold percentages.
     */
    function configureUser(address[] calldata tokenAddresses, uint256[] calldata thresholds) external {
        require(
            tokenAddresses.length == thresholds.length,
            "Token addresses and thresholds must have the same length"
        );
        require(tokenAddresses.length > 0, "You must provide at least one token and threshold");

        // Update user configuration
        userToERC20Address[msg.sender] = tokenAddresses;
        userToERC20AddressThresholdPercentage[msg.sender] = thresholds;

        // Add user to user_list if not already present
        if (!_isUserInList(msg.sender)) {
            user_list.push(msg.sender);
        }
    }

    /**
     * @dev Retrieves the tokens and thresholds configured by the user.
     * @return tokenAddresses The array of ERC20 token addresses.
     * @return thresholds The array of corresponding threshold percentages.
     */
    function getUserConfig() external view returns (address[] memory tokenAddresses, uint256[] memory thresholds) {
        return (
            userToERC20Address[msg.sender],
            userToERC20AddressThresholdPercentage[msg.sender]
        );
    }

    /**
     * @dev Allows a user to clear their configuration.
     */
    function clearUserConfig() external {
        delete userToERC20Address[msg.sender];
        delete userToERC20AddressThresholdPercentage[msg.sender];

        // Remove user from user_list
        _removeUserFromList(msg.sender);
    }

    /**
     * @dev Removes a specific token and its threshold percentage from the user's configuration.
     * @param tokenAddress The token address to remove.
     */
    function removeToken(address tokenAddress) external {
        address[] storage tokens = userToERC20Address[msg.sender];
        uint256[] storage thresholds = userToERC20AddressThresholdPercentage[msg.sender];

        uint256 length = tokens.length;
        require(length > 0, "No tokens configured");

        bool found = false;

        for (uint256 i = 0; i < length; i++) {
            if (tokens[i] == tokenAddress) {
                found = true;

                // Shift the elements after the found index
                for (uint256 j = i; j < length - 1; j++) {
                    tokens[j] = tokens[j + 1];
                    thresholds[j] = thresholds[j + 1];
                }

                // Remove the last element
                tokens.pop();
                thresholds.pop();
                break;
            }
        }

        require(found, "Token address not found");
    }

    /**
     * @dev Internal function to check if a user is already in the user_list.
     * @param user The address of the user to check.
     * @return True if the user is in the list, false otherwise.
     */
    function _isUserInList(address user) internal view returns (bool) {
        for (uint256 i = 0; i < user_list.length; i++) {
            if (user_list[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Internal function to remove a user from the user_list.
     * @param user The address of the user to remove.
     */
    function _removeUserFromList(address user) internal {
        uint256 length = user_list.length;
        for (uint256 i = 0; i < length; i++) {
            if (user_list[i] == user) {
                // Shift the elements after the found index
                for (uint256 j = i; j < length - 1; j++) {
                    user_list[j] = user_list[j + 1];
                }
                // Remove the last element
                user_list.pop();
                break;
            }
        }
    }

    address public  SWAP_ROUTER ;


    function executeStopLoss(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        address recipient,
        uint256 amountIn,
        uint256 deadline,
        uint256 chroniclePairIndex,
        uint chainlink_compare_roundid
    ) external onlyOwner returns (uint256 amountOut)  {

        int256 chainLinkPrice;uint256 age;uint chroniclePrice;

        if(useChronicle) {
            ( chroniclePrice, age) =IChronicleReader(chronicleReader).readPrice(chroniclePairIndex);
            address_to_group_id[msg.sender].push(groupId);
            groupId +=1;
        }

        if(useChainlink){
            {
                ( uint80 Past_roundId,  int256 Past_answer,  , , ) = IChainlinkOracle(chainlinkoracle).getRoundData(chainlink_compare_roundid);
                ( ,   chainLinkPrice,  ,  age, ) = IChainlinkOracle(chainlinkoracle).latestRoundData();
                require(Past_answer < chainLinkPrice,"value is not sufficiently decereased");
            }
            
        }

        // Add the record to the user's specific group
            stoplossRecords[msg.sender][groupId].push(StoplossExecutedDetails({
                erc20:tokenIn ,
                timestamp: age,
                price: useChronicle ? chroniclePrice : uint(chainLinkPrice)
            }));
        
        
        
        // Approve the SwapRouter to spend the input token
        IERC20(tokenIn).approve(SWAP_ROUTER, amountIn);

        // Create the swap parameters
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            deadline: deadline,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0 // No price limit
        });

        // Perform the swap
        amountOut = ISwapRouter(SWAP_ROUTER).exactInputSingle(params);
    }

    function withdrawERC20(address tokenAddress, address recipient, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(recipient != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than zero");
        IERC20 token = IERC20(tokenAddress);

        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient contract balance");

        bool success = token.transfer(recipient, amount);
        require(success, "Token transfer failed");

    }

    function setChronicleReader(address _chronicle) public onlyOwner {
        chronicleReader = _chronicle;
    }

    function setChainlinkOracle(address _chainlinkoracle) public onlyOwner {
        chainlinkoracle = _chainlinkoracle;
    }

    function setSwapRouter(address _SWAP_ROUTER) public onlyOwner {
        SWAP_ROUTER = _SWAP_ROUTER;
    }

    function setOracle(bool _useChronicle,bool _useChainlink) public onlyOwner {
        useChronicle = _useChronicle;
        useChainlink = _useChainlink;
    }

    function isLessByPercentage(int256 A, int256 B, int256 C) public pure returns (bool) {
        require(B > 0, "B must be greater than zero"); // Prevent division by zero
        require(C <= 100, "C must be a valid percentage (0-100)");

        // Calculate C percentage of B
        int256 threshold = (B * C) / 100;

        // Check if A is less than B by at least C percentage
        if (B - A >= threshold) {
            return true;
        }
        return false;
    }

    function getThresholdForToken(address user, address token) public view returns (uint256 threshold) {
        address[] memory tokens = userToERC20Address[user];
        uint256[] memory thresholds = userToERC20AddressThresholdPercentage[user];
        require(tokens.length == thresholds.length, "Data inconsistency: lengths do not match");

        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == token) {
                return thresholds[i];
            }
        }

        revert("Token not found for the user");
    }

    function toInt256(uint256 value) internal pure returns (int256) {
    // Cast type(int256).max to uint256 for the comparison
    require(value <= uint256(type(int256).max), "Value exceeds int256 range");
    return int256(value);
    }

    function call_chainlink_oracle(address target_user,address target_erc20_addr)public view returns (bool) {
    ( uint80 current_roundid,  int256 chainLink_current_Price,  ,  uint256 current_age, ) = IChainlinkOracle(chainlinkoracle).latestRoundData();
    ( uint80 past_roundid,   int256 chainLink_past_Price,  ,  uint256 past_age, ) = IChainlinkOracle(chainlinkoracle).getRoundData(current_roundid);

    if (current_age - past_age < 3600) {
        return false;
    }
    if (current_age - past_age > 300) {
        return false;
    }
    if (chainLink_current_Price > chainLink_current_Price ) {
        return false;
    }
    uint threshold = getThresholdForToken(target_user,target_erc20_addr);

    if (isLessByPercentage(chainLink_current_Price,chainLink_current_Price,toInt256(threshold))) {

    return true;
    }
    return  false;

    }

    function checkUpkeep(bytes calldata checkData) external view  override returns (bool upkeepNeeded, bytes memory  performData ) {
            
          if ((call_chainlink_oracle()) {
              return(true,checkData);
          } 
          else {return(false,checkData);}
    }

    function performUpkeep(bytes calldata performData ) external override {
        
        emit Logger(msg.sender, performData, block.timestamp,block.number, currCount);
    }

}