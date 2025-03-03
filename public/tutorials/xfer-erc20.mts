import {
    createWalletClient,
    http,
    publicActions,
    getContract,
    Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { interopAlpha0, interopAlpha1 } from '@eth-optimism/viem/chains'
 
import {
    walletActionsL2,
    publicActionsL2,
    createInteropSentL2ToL2Messages,
} from '@eth-optimism/viem'

const tokenAddress = "0xF3Ce0794cB4Ef75A902e07e5D2b75E4D71495ee8"
const balanceOf = {
    "constant": true,
    "inputs": [{
        "name": "_owner",
        "type": "address"
    }],
    "name": "balanceOf",
    "outputs": [{
        "name": "balance",
        "type": "uint256"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
    }

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

const wallet0 = createWalletClient({
    chain: interopAlpha0,
    transport: http(),
    account
}).extend(publicActions)
    .extend(publicActionsL2())
    .extend(walletActionsL2())
 
const wallet1 = createWalletClient({
    chain: interopAlpha1,
    transport: http(),
    account
}).extend(publicActions)
    .extend(publicActionsL2())
    .extend(walletActionsL2())

const token0 = getContract({
    address: tokenAddress,
    abi: [balanceOf],
    client: wallet0
})

const token1 = getContract({
    address: tokenAddress,
    abi: [balanceOf],
    client: wallet1
})


const reportBalances = async () => {
    const balance0 = await token0.read.balanceOf([account.address])
    const balance1 = await token1.read.balanceOf([account.address])

    console.log(`
Address: ${account.address}
    chain0: ${balance0.toString().padStart(20)}
    chain1: ${balance1.toString().padStart(20)}

`)
}

await reportBalances()

const sendTxnHash = await wallet0.interop.sendSuperchainERC20({
    tokenAddress,
    to: account.address,
    amount: 1000000000,
    chainId: wallet1.chain.id
})

console.log(`Send transaction: https://sid.testnet.routescan.io/tx/${sendTxnHash}`)

const sendTxnReceipt = await wallet0.waitForTransactionReceipt({
    hash: sendTxnHash
})

const sentMessage =  
    (await createInteropSentL2ToL2Messages(wallet0, { receipt: sendTxnReceipt }))
        .sentMessages[0]

const relayTxnHash = await wallet1.interop.relayMessage({
    sentMessageId: sentMessage.id,
    sentMessagePayload: sentMessage.payload,
})

const relayTxnReceipt = await wallet1.waitForTransactionReceipt({
    hash: relayTxnHash
})

console.log(`Relay transaction: https://sid.testnet.routescan.io/tx/${relayTxnHash}`)

await reportBalances()
