(async () => {

  const { createWalletClient, createPublicClient, http, getContract  } = require('viem');
  const { sepolia, optimismSepolia } = require('viem/chains');
  const { privateKeyToAccount } = require('viem/accounts');
  const { depositERC20 } = require('@eth-optimism/viem');

  // Define token addresses and other configuration
const PRIVATE_KEY = process.env.TUTORIAL_PRIVATE_KEY
const L1_RPC_URL = 'https://rpc.ankr.com/eth_sepolia'
const L2_RPC_URL = 'https://sepolia.optimism.io'

const l1Token = "0x5589BB8228C07c4e15558875fAf2B859f678d129"
const l2Token = "0xD08a2917653d4E460893203471f0000826fb4034"

const erc20ABI = [{ constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "balance", type: "uint256" }], type: "function" }, { inputs: [], name: "faucet", outputs: [], stateMutability: "nonpayable", type: "function" }]

// Create your account from private key
const account = privateKeyToAccount(PRIVATE_KEY)

  const l1Provider = createPublicClient({
    chain: sepolia,
    transport: http(L1_RPC_URL)
  })
  
  const l2Provider = createPublicClient({
    chain: optimismSepolia,
    transport: http(L2_RPC_URL)
  })

  const l1Wallet = createWalletClient({
    account,
    chain: sepolia,
    transport: http("https://rpc.ankr.com/eth_sepolia"),
  });

  const l2Wallet = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http("https://sepolia.optimism.io"),
  });

  const walletAddress = account.address

  const oneToken = 1000000000000000000n

  // Check L1 token balance
  const l1Balance = await l1Provider.readContract({
    address: l1Token,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [walletAddress]
  })
  console.log(`Initial L1 balance: ${l1Balance}`)

  // Check L2 token balance
  const l2Balance = await l2Provider.readContract({
    address: l2Token,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [walletAddress]
  })
  console.log(`Initial L2 balance: ${l2Balance}`)


  // Define the amount to bridge
const amountToBridge = parseEther('0.01') // Adjust based on token decimals

// Check current allowance
const currentAllowance = await l1Provider.readContract({
  address: l1Token,
  abi: erc20ABI,
  functionName: 'allowance',
  args: [walletAddress, '0x3154Cf16ccdb4C6d922629664174b904d80F2C35'] // L1 Standard Bridge
})

// Approve tokens if needed
if (currentAllowance < amountToBridge) {
  console.log('Approving tokens for transfer...')
  const approvalTx = await l1Wallet.writeContract({
    address: l1Token,
    abi: erc20ABI,
    functionName: 'approve',
    args: ['0x3154Cf16ccdb4C6d922629664174b904d80F2C35', amountToBridge]
  })
  
  console.log(`Approval transaction hash: ${approvalTx}`)
  await l1PublicClient.waitForTransactionReceipt({ hash: approvalTx })
  console.log('Token approval complete')
}

console.log(`Bridging ${amountToBridge} tokens to L2...`)

const depositTx = await depositERC20(l1Wallet, {
  tokenAddress: l1Token,
  remoteTokenAddress: l2Token,
  amount: amountToBridge,
  targetChain: optimism,
  minGasLimit: 200000 // Recommended minimum gas limit
})

console.log(`Deposit transaction hash: ${depositTx}`)

console.log('Waiting for deposit transaction to be confirmed on L1...')
const depositReceipt = await l1Provider.waitForTransactionReceipt({ 
  hash: depositTx,
  confirmations: 1
})
console.log(`Deposit confirmed in block ${depositReceipt.blockNumber}`)

console.log('Waiting for message to be relayed to L2...')
console.log('This may take 1-5 minutes on mainnet...')

console.log('Waiting for message to be relayable...')
await l1Provider.getWithdrawalStatus({ 
  receipt, 
  targetChain: l2Provider.chain, 
}) 

console.log('Relaying message...')
const [message] = getWithdrawals(receipt)
await l1Provider.waitToFinalize({ withdrawalHash: message.withdrawalHash, targetChain: l2Provider.chain }) 

// console.log('Message status:', result.status)
// console.log('L2 transaction hash:', result.transactionReceipt?.transactionHash)

const l2BalanceAfter = await l2Provider.readContract({
  address: l1Token,
  abi: erc20ABI,
  functionName: 'balanceOf',
  args: [walletAddress]
})

console.log(`Final L2 balance: ${l2BalanceAfter}`)
console.log(`Increase: ${l2BalanceAfter - l2Balance}`)
console.log('Token bridging complete!')


const l1ERC20 = getContract({
  address: l1Token,
  abi: erc20ABI,
  client: l1Wallet
})


})()
