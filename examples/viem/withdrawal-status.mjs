// Source: https://github.com/wevm/viem/blob/main/src/chains/opStack/actions/getWithdrawalStatus.ts
// Docs: https://viem.sh/op-stack/actions/getWithdrawalStatus
import { createPublicClient, http } from 'viem'
import { mainnet, optimism } from 'viem/chains'
import { publicActionsL1, publicActionsL2 } from 'viem/op-stack'
// https://optimistic.etherscan.io/tx/0x7b5cedccfaf9abe6ce3d07982f57bcb9176313b019ff0fc602a0b70342fe3147
const DEFAULT_TX_HASH = '0x7b5cedccfaf9abe6ce3d07982f57bcb9176313b019ff0fc602a0b70342fe3147'

const l1Client = createPublicClient({
  name: "Ethereum L1 Client",
  // Note: you should consider using an authenticated endpoint to prevent throttling
  transport: http(mainnet.rpcUrls.default.http[0]),
  chain: mainnet,
}).extend(publicActionsL1())

const l2Client = createPublicClient({
  name: "Optimism L2 Client",
  // Note: you should consider using an authenticated endpoint to prevent throttling
  transport: http(optimism.rpcUrls.default.http[0]),
  // TODO this type needing to be cast is an actual bug in viem
  chain: /** import('viem').Chain*/(optimism),
}).extend(publicActionsL2())

/**
 * @param {import('viem').Hex} txHash
 */
export const getWithdrawalStatusExample = async (txHash = DEFAULT_TX_HASH) => {
  const receipt = await l2Client.getTransactionReceipt({
    hash: txHash,
  })
  const status = await l1Client.getWithdrawalStatus({
    receipt,
    chain: l1Client.chain,
    targetChain: l2Client.chain,
  })

  console.log(status) // ready-to-prove

  return status
}

