export TUTORIAL_RPC_URL=https://goerli.optimism.io

# Replace this with your L1 ERC-20 token if not using the testing token!
export TUTORIAL_L1_ERC20_ADDRESS=0x32B3b2281717dA83463414af4E8CfB1970E56287

cast send 0x4200000000000000000000000000000000000012 "createOptimismMintableERC20(address,string,string)" $TUTORIAL_L1_ERC20_ADDRESS "My Standard Demo Token" "L2TKN" --private-key $PRIVATE_KEY --rpc-url $OP_GOERLI_RPC_URL --json | jq -r '.logs[0].topics[2]' | cast parse-bytes32-address
