import { createPublicClient, createWalletClient, http, parseEther, parseGwei, formatEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { optimismSepolia } from 'viem/chains'
import { publicActionsL2, walletActionsL2 } from 'viem/op-stack'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Set up the account
const account = privateKeyToAccount(process.env.PRIVATE_KEY)

// Set up the public client
const publicClient = createPublicClient({
  chain: optimismSepolia,
  transport: http(process.env.L2_RPC_URL),
}).extend(publicActionsL2())

// Set up the wallet client
const walletClient = createWalletClient({
  chain: optimismSepolia,
  transport: http(process.env.L2_RPC_URL),
}).extend(walletActionsL2())

async function estimateTransactionCosts() {
  try {
    // Prepare the transaction
    const transaction = {
      account,
      to: '0x1000000000000000000000000000000000000000',
      value: parseEther('0.1'),
      gasPrice: parseGwei('20')
    }

    // Estimate gas limit
    const gasLimit = await publicClient.estimateGas(transaction)
    console.log(`Estimated Gas Limit: ${gasLimit}`)

    // Get current gas price
    const effectiveGasPrice = await publicClient.getGasPrice()
    console.log(`Effective Gas Price: ${formatEther(effectiveGasPrice)} ETH`)

    // Calculate execution gas fee
    const l2CostEstimate = gasLimit * effectiveGasPrice
    console.log(`Estimated Execution Gas Fee: ${formatEther(l2CostEstimate)} ETH`)

    // Estimate L1 data fee
    const l1CostEstimate = await publicClient.estimateL1Gas(transaction)
    console.log(`Estimated L1 Data Fee: ${formatEther(l1CostEstimate)} ETH`)

    // Calculate total estimated cost
    const totalEstimate = l2CostEstimate + l1CostEstimate
    console.log(`Estimated Total Cost: ${formatEther(totalEstimate)} ETH`)

    // Send the transaction
    const txHash = await walletClient.sendTransaction(transaction)
    console.log(`Transaction Hash: ${txHash}`)

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

    // Calculate actual costs
    const l2CostActual = receipt.gasUsed * receipt.effectiveGasPrice
    console.log(`Actual Execution Gas Fee: ${formatEther(l2CostActual)} ETH`)

    const l1CostActual = await publicClient.estimateL1Fee({ hash: txHash })
    console.log(`Actual L1 Data Fee: ${formatEther(l1CostActual)} ETH`)

    const totalActual = l2CostActual + l1CostActual
    console.log(`Actual Total Cost: ${formatEther(totalActual)} ETH`)

    // Compare estimated vs actual costs
    const difference = totalEstimate - totalActual
    console.log(`Estimation Difference: ${formatEther(difference)} ETH`)

  } catch (error) {
    console.error('Error:', error)
  }
}

estimateTransactionCosts()