(async () => {

const { createPublicClient, http } = require('viem');
const { optimismSepolia } = require('viem/chains');
const {  publicActionsL1, publicActionsL2} = require('viem/op-stack');

const transactionHash = process.env.TUTORIAL_TRANSACTION_HASH

const l1Provider = createPublicClient({ chain: sepolia, transport: http("https://rpc.ankr.com/eth_sepolia") }).extend(publicActionsL1())
const l2Provider = createPublicClient({ chain: optimismSepolia, transport: http("https://sepolia.optimism.io") }).extend(publicActionsL2());

console.log('Waiting for message to be provable...')
await l1Provider.getWithdrawalStatus({ 
  receipt, 
  targetChain: l2Provider.chain, 
}) 

console.log('Proving message...')
const receipt = await l2Provider.getTransactionReceipt(transactionHash)
const output = await l1Provider.waitToProve({ 
  receipt, 
  targetChain: l2Provider.chain, 
}) 

console.log('Waiting for message to be relayable...')
await l1Provider.getWithdrawalStatus({ 
  receipt, 
  targetChain: l2Provider.chain, 
}) 

console.log('Relaying message...')
const [message] = getWithdrawals(receipt)
await l1Provider.waitToFinalize({ withdrawalHash: message.withdrawalHash, targetChain: l2Provider.chain }) 

console.log('Waiting for message to be relayed...')
await l1Provider.getWithdrawalStatus({ receipt, targetChain: l2Provider.chain }) 


})()
