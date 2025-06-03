#! /bin/sh

rm -rf testing
mkdir -p testing/forge
cd testing/forge

forge init
find . -name 'Counter*' -exec rm {} \;
cd lib
npm install @eth-optimism/contracts-bedrock
cd ..
echo @eth-optimism/=lib/node_modules/@eth-optimism/ >> remappings.txt

cat > src/Greeter.sol <<EOF
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
 
interface IL2ToL2CrossDomainMessenger {
    function crossDomainMessageContext() external view returns (address sender_, uint256 source_);        
}
 
contract Greeter {
 
    IL2ToL2CrossDomainMessenger public immutable messenger =
        IL2ToL2CrossDomainMessenger(Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
 
    string greeting;
 
    event SetGreeting(
        address indexed sender,     // msg.sender
        string greeting
    ); 
 
    event CrossDomainSetGreeting(
        address indexed sender,   // Sender on the other side
        uint256 indexed chainId,  // ChainID of the other side
        string greeting
    );
 
    function greet() public view returns (string memory) {
        return greeting;
    }
 
    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit SetGreeting(msg.sender, _greeting);
 
        if (msg.sender == Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER) {
            (address sender, uint256 chainId) =
                messenger.crossDomainMessageContext();              
            emit CrossDomainSetGreeting(sender, chainId, _greeting);
        }
    }
}
EOF

cat > src/GreetingSender.sol <<EOF
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
import { IL2ToL2CrossDomainMessenger } from "@eth-optimism/contracts-bedrock/src/L2/IL2ToL2CrossDomainMessenger.sol";

import { Greeter } from "src/Greeter.sol";

contract GreetingSender {
    IL2ToL2CrossDomainMessenger public immutable messenger =
        IL2ToL2CrossDomainMessenger(Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER);

    address immutable greeterAddress;
    uint256 immutable greeterChainId;

    constructor(address _greeterAddress, uint256 _greeterChainId) {
        greeterAddress = _greeterAddress;
        greeterChainId = _greeterChainId;
    }

    function setGreeting(string calldata greeting) public {
        bytes memory message = abi.encodeCall(
            Greeter.setGreeting,
            (greeting)
        );
        messenger.sendMessage(greeterChainId, greeterAddress, message);
    }
}
EOF


cat > test/GreetingSender.t.sol <<EOF
pragma solidity ^0.8.0;
 
import { Test } from "forge-std/Test.sol";

import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
import { IL2ToL2CrossDomainMessenger } from "@eth-optimism/contracts-bedrock/src/L2/IL2ToL2CrossDomainMessenger.sol";

import { GreetingSender } from "src/GreetingSender.sol";
import { Greeter } from "src/Greeter.sol";
 
contract GreetingSenderTest is Test {

    address constant targetGreeter = address(0x0123456789012345678901234567890123456789);
    uint256 constant targetChain = 902;

    GreetingSender greetingSender;

    /// @notice Emitted whenever a message is sent to a destination
    /// @param destination  Chain ID of the destination chain.
    /// @param target       Target contract or wallet address.
    /// @param messageNonce Nonce associated with the message sent
    /// @param sender       Address initiating this message call
    /// @param message      Message payload to call target with.
    event SentMessage(
        uint256 indexed destination, address indexed target, uint256 indexed messageNonce, address sender, bytes message
    );    
 
    function setUp() public {
        greetingSender = new GreetingSender(targetGreeter, targetChain);
    }
 
    function test_SendGreeting() public {
        string memory greeting = "Hello";

        bytes memory message = abi.encodeCall(
            Greeter.setGreeting,
            (greeting)
        );
        
        // Ignore the nonce
        vm.expectEmit(true, true, false, true);
        emit SentMessage(targetChain, targetGreeter, 0, address(greetingSender), message);

        greetingSender.setGreeting(greeting);
    }
}
EOF


