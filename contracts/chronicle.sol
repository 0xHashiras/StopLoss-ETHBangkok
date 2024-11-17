// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;


// Copied from [chronicle-std](https://github.com/chronicleprotocol/chronicle-std/blob/main/src/IChronicle.sol).
interface IChronicle {
    function read() external view returns (uint256 value);
    function readWithAge() external view returns (uint256 value, uint256 age);
}

// Copied from [self-kisser](https://github.com/chronicleprotocol/self-kisser/blob/main/src/ISelfKisser.sol).
interface ISelfKisser {
    function selfKiss(address oracle) external;
}


contract OracleReader {

    address[10] public selfKisserAddress ;
    ISelfKisser public selfKisser;
    address[] public chroniclesPair;
    mapping(address=>uint256) public chroniclesPair2index;

    constructor() {
        selfKisserAddress[0] = 0x0Dcc19657007713483A5cA76e6A7bbe5f56EA37d  ; // Ethereum Sepolia	
        selfKisserAddress[1] = 0x70E58b7A1c884fFFE7dbce5249337603a28b8422  ; // Base Sepolia	
        selfKisserAddress[2] = 0xc0fe3a070Bc98b4a45d735A52a1AFDd134E0283f  ; // Arbitrum Sepolia	
        selfKisserAddress[3] = 0xCce64A8127c051E784ba7D84af86B2e6F53d1a09  ; // Polygon zkEVM Testnet Cardona	
        selfKisserAddress[4] = 0x0Dcc19657007713483A5cA76e6A7bbe5f56EA37d  ; // Gnosis Mainnet	
        selfKisserAddress[5] = 0x9ee0DC1f7cF1a5c083914e3de197Fd1F484E0578  ; // Mantle Testnet	
        selfKisserAddress[6] = 0x0Dcc19657007713483A5cA76e6A7bbe5f56EA37d  ; // Scroll Sepolia	
        selfKisserAddress[7] = 0x25f594edde4f58A14970b2ef6616badBa4B1CdDD  ; // zkSync Sepolia	
        selfKisserAddress[8] = 0xfF619a90cDa4020897808D74557ce3b648922C37  ; // Optimism Sepolia	
        selfKisserAddress[9] = 0x2FFCAfF4BcF6D425c424f303eff66954Aa3A27Fd  ; // Berachain Bartio	
        
        // Declare SelfKisser based on chain
        uint256 chainId = 0;
        selfKisser = ISelfKisser(address(selfKisserAddress[chainId]));
        
        // Note to add address(this) to chronicle oracle's whitelist.
        // This allows the contract to read from the chronicle oracle.
    }

    // ETH2USD
    // ["0xdd6D76262Fd7BdDe428dcfCd94386EbAe0151603"]   // sepolia
    // ["0xea347Db6ef446e03745c441c17018eF3d641Bc8f"]   // Base Sepolia
    // ["0x77833F676fe5FB32e55986770092f54707d72c21"]   // Arbitrum Sepolia	
    // ["0x5D0474aF2da14B1748730931Af44d9b91473681b"]   // Polygon zkEVM Testnet Cardona	
    // ["0xa6896dCf3f5Dc3c29A5bD3a788D6b7e901e487D8"]   // Mantle Testnet	
    // ["0xc8A1F9461115EF3C1E84Da6515A88Ea49CA97660"]   // Scroll Sepolia	
    function performSelfKiss(address[] memory chronicles) public returns(bool){
        for(uint i=0; i<chronicles.length; ++i){
            selfKisser.selfKiss(address(chronicles[i]));
            chroniclesPair.push(chronicles[i]);
            chroniclesPair2index[chronicles[i]]=i;
        }
        return true;
    }

    /** 
    * @notice Function to read the latest data from the Chronicle oracle.
    * @return val The current value returned by the oracle.
    * @return age The timestamp of the last update from the oracle.
    */
    function readPrice(uint256 chroniclesPairIndex) external view returns (uint256 val, uint256 age) {
        IChronicle chronicle = IChronicle(address(chroniclesPair[chroniclesPairIndex]));
        (val, age) = chronicle.readWithAge();
    }

    
}
