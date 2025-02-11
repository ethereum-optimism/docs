(async () => {

  const { createPublicClient, http, createWalletClient } = require("viem");
  const { optimismSepolia, sepolia } = require("viem/chains");
  const { publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2, getWithdrawals } = require("viem/op-stack");
  const { privateKeyToAccount } = require("viem/accounts");

  const l1Provider = createPublicClient({ chain: sepolia, transport: http("https://eth-sepolia.g.alchemy.com/v2/***") }).extend(publicActionsL1())
  const l2Provider = createPublicClient({ chain: optimismSepolia, transport: http("https://opt-sepolia.g.alchemy.com/v2/***") }).extend(publicActionsL2())
  const account = privateKeyToAccount(process.env.TUTORIAL_PRIVATE_KEY)
  
  const l1Wallet = createWalletClient({
    chain: sepolia,
    transport:  http("https://eth-sepolia.g.alchemy.com/v2/***")
  }).extend(walletActionsL1())

  const l2Wallet = createWalletClient({
    chain: optimismSepolia,
    transport:  http("https://opt-sepolia.g.alchemy.com/v2/***")
  }).extend(walletActionsL2())

  const receipt = await l2Provider.getTransactionReceipt({
    hash: process.env.TUTORIAL_TRANSACTION_HASH
  })
  
  console.log('Waiting for message to be provable...')
  await l1Provider.getWithdrawalStatus({ 
    receipt, 
    targetChain: l2Provider.chain, 
  })

  console.log('Proving message...')
  const { output, withdrawal } = await l1Provider.waitToProve({ 
    receipt, 
    targetChain: l2Provider.chain, 
  })

  const args = await l2Provider.buildProveWithdrawal({
    account,
    output,
    withdrawal,
  })
  
  const hash = await l1Wallet.proveWithdrawal(args)

  console.log('Waiting for message to be relayable...')
  await l1Provider.getWithdrawalStatus({ 
    receipt, 
    targetChain: l2Provider.chain, 
  }) 

  console.log('Relaying message...')
  const [message] = getWithdrawals(receipt)
  await l1Provider.waitToFinalize({ withdrawalHash: message.withdrawalHash, targetChain: l2Provider.chain }) 

  const finalizeHash = await l1Wallet.finalizeWithdrawal({
    targetChain: l2Wallet.chain,
    withdrawal,
  })

  console.log('Waiting for message to be relayed...')
  await l1Provider.getWithdrawalStatus({ receipt, targetChain: l2Provider.chain }) 


})()
