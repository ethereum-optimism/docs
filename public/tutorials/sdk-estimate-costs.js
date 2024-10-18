(async () => {

const { createPublicClient, createWalletClient, http, parseEther, parseGwei, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { optimismSepolia } = require('viem/chains');
const { publicActionsL2, walletActionsL2 } = require('viem/op-stack');

const privateKey = process.env.TUTORIAL_PRIVATE_KEY
const account = privateKeyToAccount(privateKey)

const publicClient = createPublicClient({
  chain: optimismSepolia,
  transport: http("https://sepolia.optimism.io"),
}).extend(publicActionsL2())

const walletClientL2 = createWalletClient({
  chain: optimismSepolia,
  transport: http("https://sepolia.optimism.io"),
}).extend(walletActionsL2())

  const transaction = {
  account,
  to: '0x1000000000000000000000000000000000000000',
  value: parseEther('0.00069420'),
  gasPrice: await publicClient.getGasPrice() 
  }

  const totalEstimate = await publicClient.estimateTotalFee(transaction)
  console.log(`Estimated Total Cost: ${formatEther(totalEstimate)} ETH`)

  const txHash = await walletClientL2.sendTransaction(transaction)
  console.log(`Transaction Hash: ${txHash}`)

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  console.log('receipt', receipt);

  const l2CostActual = receipt.gasUsed * receipt.effectiveGasPrice
  console.log(`Actual Execution Gas Fee: ${formatEther(l2CostActual)} ETH`)

  const l1CostActual = receipt.l1Fee
  console.log(`Actual L1 Data Fee: ${formatEther(l1CostActual)} ETH`)

  const totalActual = l2CostActual + l1CostActual
  console.log(`Actual Total Cost: ${formatEther(totalActual)} ETH`)

  const difference = totalEstimate >= totalActual ? totalEstimate - totalActual : totalActual - totalEstimate
  console.log(`Estimation Difference: ${formatEther(difference)} ETH`)

})()