#! /bin/sh

rm -rf manual-relay
mkdir -p manual-relay/onchain
cd manual-relay/onchain

PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
USER_ADDRESS=`cast wallet address --private-key $PRIVATE_KEY`
URL_CHAIN_A=http://localhost:9545
URL_CHAIN_B=http://localhost:9546

forge init
cd lib
npm install @eth-optimism/contracts-bedrock
cd ..
echo @eth-optimism/=lib/node_modules/@eth-optimism/ >> remappings.txt

cat > src/Greeter.sol <<EOF
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Greeter {
    string greeting;

    event SetGreeting(
        address indexed sender,     // msg.sender
        string greeting
    );

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit SetGreeting(msg.sender, _greeting);
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

CHAIN_ID_B=`cast chain-id --rpc-url $URL_CHAIN_B`
GREETER_B_ADDRESS=`forge create --rpc-url $URL_CHAIN_B --private-key $PRIVATE_KEY Greeter --broadcast | awk '/Deployed to:/ {print $3}'`
GREETER_A_ADDRESS=`forge create --rpc-url $URL_CHAIN_A --private-key $PRIVATE_KEY --broadcast GreetingSender --constructor-args $GREETER_B_ADDRESS $CHAIN_ID_B | awk '/Deployed to:/ {print $3}'`

echo Setup done

cd ..

cat > sendAndRelay.sh <<EOF
#! /bin/sh
PRIVATE_KEY=$PRIVATE_KEY
USER_ADDRESS=$USER_ADDRESS
URL_CHAIN_A=$URL_CHAIN_A
URL_CHAIN_B=$URL_CHAIN_B
GREETER_A_ADDRESS=$GREETER_A_ADDRESS
GREETER_B_ADDRESS=$GREETER_B_ADDRESS
CHAIN_ID_B=$CHAIN_ID_B

cast send -q --private-key \$PRIVATE_KEY --rpc-url \$URL_CHAIN_A \$GREETER_A_ADDRESS "setGreeting(string)" "Hello from chain A \$$"

cast logs "SentMessage(uint256,address,uint256,address,bytes)" --rpc-url \$URL_CHAIN_A | tail -14 > log-entry
TOPICS=\`cat log-entry | grep -A4 topics | awk '{print \$1}' | tail -4 | sed 's/0x//'\`
TOPICS=\`echo \$TOPICS | sed 's/ //g'\`

ORIGIN=0x4200000000000000000000000000000000000023
BLOCK_NUMBER=\`cat log-entry | awk '/blockNumber/ {print \$2}'\`
LOG_INDEX=\`cat log-entry | awk '/logIndex/ {print \$2}'\`
TIMESTAMP=\`cast block \$BLOCK_NUMBER --rpc-url \$URL_CHAIN_A | awk '/timestamp/ {print \$2}'\`
CHAIN_ID_A=\`cast chain-id --rpc-url \$URL_CHAIN_A\`
SENT_MESSAGE=\`cat log-entry | awk '/data/ {print \$2}'\`
LOG_ENTRY=0x\`echo \$TOPICS\$SENT_MESSAGE | sed 's/0x//'\`

RPC_PARAMS=\$(cat <<INNER_END_OF_FILE
{
    "origin": "\$ORIGIN",
    "blockNumber": "\$BLOCK_NUMBER",
    "logIndex": "\$LOG_INDEX",
    "timestamp": "\$TIMESTAMP",
    "chainId": "\$CHAIN_ID_A",
    "payload": "\$LOG_ENTRY"
}
INNER_END_OF_FILE
)

ACCESS_LIST=\`cast rpc admin_getAccessListForIdentifier --rpc-url http://localhost:8420 "\$RPC_PARAMS" | jq .accessList\`

echo Old greeting
cast call \$GREETER_B_ADDRESS "greet()(string)" --rpc-url \$URL_CHAIN_B

cast send -q \$ORIGIN "relayMessage((address,uint256,uint256,uint256,uint256),bytes)" "(\$ORIGIN,\$BLOCK_NUMBER,\$LOG_INDEX,\$TIMESTAMP,\$CHAIN_ID_A)" \$LOG_ENTRY --access-list "\$ACCESS_LIST" --rpc-url \$URL_CHAIN_B --private-key \$PRIVATE_KEY

echo New greeting
cast call \$GREETER_B_ADDRESS "greet()(string)" --rpc-url \$URL_CHAIN_B

EOF

chmod +x sendAndRelay.sh

echo Set these environment variables
echo GREETER_A_ADDRESS=$GREETER_A_ADDRESS
echo GREETER_B_ADDRESS=$GREETER_B_ADDRESS
echo PRIVATE_KEY=$PRIVATE_KEY
