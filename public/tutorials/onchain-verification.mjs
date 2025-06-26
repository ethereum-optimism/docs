import {
    createWalletClient,
    http,
    publicActions,
    getContract,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
 
import { interopAlpha0, interopAlpha1, supersimL2A, supersimL2B } from '@eth-optimism/viem/chains'
import { walletActionsL2, publicActionsL2 } from '@eth-optimism/viem'
import { readFile } from 'fs/promises';

async function loadVerifierAbi() {
    const data = await readFile('../onchain/out/Verifier.sol/Verifier.json')
    return JSON.parse(data);
}

const verifierAbi = (await loadVerifierAbi()).abi

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

const relayMessageParams = await wallet0.interop.buildExecutingMessage({
  log: attestLogEntry,
})
 
const verifier = getContract({
  address: process.env.VERIFIER_ADDRESS,
  abi: verifierAbi,
  client: wallet1,
})

const verificationTransaction = await verifier.write.verifyAttestation({
  args: [
    "0x" + relayMessageParams.payload.slice(90,130),
    "0x" + relayMessageParams.payload.slice(154,194),
    relayMessageParams.id.logIndex,
    relayMessageParams.id.blockNumber,
    relayMessageParams.id.timestamp,
    relayMessageParams.id.chainId,
    "Bill Hamm"
  ],
  accessList: relayMessageParams.accessList
})

console.log(`VERIFICATION_TRANSACTION_HASH=${verificationTransaction}`)