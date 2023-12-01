(async () => {

const optimism = require("@eth-optimism/sdk")
const ethers = require("ethers")

const privateKey = process.env.TUTORIAL_PRIVATE_KEY

const l1Provider = new ethers.providers.StaticJsonRpcProvider("https://rpc.ankr.com/eth_sepolia")
const l2Provider = new ethers.providers.StaticJsonRpcProvider("https://sepolia.optimism.io")
const l1Wallet = new ethers.Wallet(privateKey, l1Provider)
const l2Wallet = new ethers.Wallet(privateKey, l2Provider)

console.log('L1 balance:')
console.log((await l1Wallet.getBalance()).toString())

const messenger = new optimism.CrossChainMessenger({
  l1ChainId: 11155111, // 11155111 for Sepolia, 1 for Ethereum
  l2ChainId: 11155420, // 11155420 for OP Sepolia, 10 for OP Mainnet
  l1SignerOrProvider: l1Wallet,
  l2SignerOrProvider: l2Wallet,
})

console.log('Depositing ETH...')
tx = await messenger.depositETH(ethers.utils.parseEther('0.01'))
await tx.wait()

console.log('Waiting for deposit to be relayed...')
await messenger.waitForMessageStatus(tx.hash, optimism.MessageStatus.RELAYED)

console.log('L1 balance:')
console.log((await l1Wallet.getBalance()).toString())

console.log('L2 balance:')
console.log((await l2Wallet.getBalance()).toString())

console.log('Withdrawing ETH...')
const withdrawal = await messenger.withdrawETH(ethers.utils.parseEther('0.01'))
await withdrawal.wait()

console.log('L2 balance:')
console.log((await l2Wallet.getBalance()).toString())

console.log('Waiting for withdrawal to be provable...')
await messenger.waitForMessageStatus(withdrawal.hash, optimism.MessageStatus.READY_TO_PROVE)

console.log('Proving withdrawal...')
await messenger.proveMessage(withdrawal.hash)

console.log('Waiting for withdrawal to be relayable...')
await messenger.waitForMessageStatus(withdrawal.hash, optimism.MessageStatus.READY_FOR_RELAY)

console.log('Relaying withdrawal...')
await messenger.finalizeMessage(withdrawal.hash)

console.log('Waiting for withdrawal to be relayed...')
await messenger.waitForMessageStatus(withdrawal.hash, optimism.MessageStatus.RELAYED)

console.log('L1 balance:')
console.log((await l1Wallet.getBalance()).toString())

})()
