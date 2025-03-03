import {
  createWalletClient,
  http,
  defineChain,
  publicActions,
  getContract,
  Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { supersimL2A, supersimL2B } from '@eth-optimism/viem/chains'


import greeterData from './Greeter.json'
import greetingSenderData from './GreetingSender.json'

const account = privateKeyToAccount(process.env.PRIV_KEY as `0x${string}`)

const walletA = createWalletClient({
  chain: supersimL2A,
  transport: http(),
  account
}).extend(publicActions)

const walletB = createWalletClient({
  chain: supersimL2B,
  transport: http(),
  account
}).extend(publicActions)

const greeter = getContract({
  address: process.env.GREETER_B_ADDR as Address,
  abi: greeterData.abi,
  client: walletB
})

const greetingSender = getContract({
  address: process.env.GREETER_A_ADDR as Address,
  abi: greetingSenderData.abi,
  client: walletA
})
const txnBHash = await greeter.write.setGreeting(["Greeting directly to chain B"])
await walletB.waitForTransactionReceipt({hash: txnBHash})

const greeting1 = await greeter.read.greet()
console.log(`Chain B Greeting: ${greeting1}`)

const txnAHash = await greetingSender.write.setGreeting(["Greeting through chain A"])
await walletA.waitForTransactionReceipt({hash: txnAHash})

const greeting2 = await greeter.read.greet()
console.log(`Chain A Greeting: ${greeting2}`)