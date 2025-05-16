import {
    createWalletClient,
    http,
    publicActions,
    getContract,
    keccak256, 
    toBytes,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { interopAlpha0, interopAlpha1, supersimL2A, supersimL2B } from '@eth-optimism/viem/chains'
import { walletActionsL2, publicActionsL2, crossL2InboxAbi } from '@eth-optimism/viem'

// Contract addresses in all OP Stack blockchains
const EASContractAddress = "0x4200000000000000000000000000000000000021" 

const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const useSupersim = process.env.CHAIN_B_ID == 902

const wallet0 = createWalletClient({
    chain: useSupersim ? supersimL2A : interopAlpha0,
    transport: http(),
    account
}).extend(publicActions)
    .extend(publicActionsL2())

const wallet1 = createWalletClient({
    chain: useSupersim ? supersimL2B : interopAlpha1,
    transport: http(),
    account
}).extend(publicActions)
    .extend(walletActionsL2())

let receipt

try {
  receipt = await wallet0.getTransactionReceipt({ hash: process.env.ATTEST_TXN })
} catch(err) {
  console.log(`Verification failed, there is no ${process.env.ATTEST_TXN} transaction on the source chain`)
  process.exit(0)
}

const attestLogEntry = receipt.logs.filter(x => 
    (x.address == EASContractAddress) &&
    (x.topics[0] == "0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35"))[0]

// attestLogEntry.topics[1] = "0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b34"

const relayMessageParams = await wallet0.interop.buildExecutingMessage({
  log: attestLogEntry,
})

const crossL2Inbox = getContract({
  address: '0x4200000000000000000000000000000000000022',
  abi: crossL2InboxAbi,
  client: wallet1,
})

let executingTransaction, executingTransactionReceipt

try {
  executingTransaction = await crossL2Inbox.write.validateMessage(
    {
      args: [
        relayMessageParams.id, 
        keccak256(toBytes(relayMessageParams.payload))
      ],  
      accessList: relayMessageParams.accessList,
    }
  )
} catch (err) {
  console.log("Verification failed (revert)")
  process.exit(0)
}

try {
  executingTransactionReceipt = await wallet1.waitForTransactionReceipt({
    hash: executingTransaction,
    timeout: 10_000 
  })    
} catch (err) {
  console.log("Verification failed (timeout)")
  process.exit(0)
}

const verified = 
  executingTransactionReceipt.logs.filter(
    x => x.address=="0x4200000000000000000000000000000000000022" &&
         x.topics[0] == "0x5c37832d2e8d10e346e55ad62071a6a2f9fa5130614ef2ec6617555c6f467ba7" &&
         x.topics[1] == keccak256(toBytes(relayMessageParams.payload))
  ).length > 0

if (verified) {
  console.log("Verification successful")
} else {
  console.log("Verification failed")
}
