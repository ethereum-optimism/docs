(async () => {

const { createPublicClient, http, createWalletClient, parseEther, formatEther } = require('viem');
const { sepolia, optimismSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');
const { getL2TransactionHashes, publicActionsL1, publicActionsL2, walletActionsL1, walletActionsL2 } = require('viem/op-stack');


const PRIVATE_KEY = process.env.TUTORIAL_PRIVATE_KEY;
const account = privateKeyToAccount(PRIVATE_KEY);


const publicClientL1 = createPublicClient({
    chain: sepolia,
    transport: http("https://rpc.ankr.com/eth_sepolia"),
}).extend(publicActionsL1()) 


const walletClientL1 = createWalletClient({
    account,
    chain: sepolia,
    transport: http("https://rpc.ankr.com/eth_sepolia"),
}).extend(walletActionsL1());


const publicClientL2 = createPublicClient({
    chain: optimismSepolia,
    transport: http("https://sepolia.optimism.io"),
}).extend(publicActionsL2());


const walletClientL2 = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http("https://sepolia.optimism.io"),
}).extend(walletActionsL2());

const l1Balance = await publicClientL1.getBalance({ address: account.address });
console.log(`L1 Balance: ${formatEther(l1Balance)} ETH`); 

async function depositETH() {


const args = await publicClientL2.buildDepositTransaction({
    mint: parseEther("0.0001"),
    to: account.address,
});

const hash = await walletClientL1.depositTransaction(args);
console.log(`Deposit transaction hash on L1: ${hash}`);

const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
console.log('L1 transaction confirmed:', receipt);

const l2Hashes = getL2TransactionHashes(receipt);
console.log(`Corresponding L2 transaction hash: ${l2Hashes}`);

const l2Receipt = await publicClientL2.waitForTransactionReceipt({
    hash: l2Hashes,
});
console.log('L2 transaction confirmed:', l2Receipt);
console.log('Deposit completed successfully!');
} 


async function withdrawETH() {
    
//Add the same imports used in DepositETH function
const args = await publicClientL2.buildWithdrawalTransaction({
withdrawalAmount: parseEther("0.0001"),
to: account.address,
});

const hash = await walletClientL2.initiateWithdrawal(args);
console.log(`Withdrawal transaction hash on L2: ${hash}`);

const receipt = await publicClientL2.waitForTransactionReceipt({ hash });
console.log('L2 transaction confirmed:', receipt);

const { output, withdrawal } = await publicClientL1.waitToProve({
receipt,
targetChain: walletClientL2.chain
});

const proveArgs = await publicClientL2.buildProveWithdrawal({
output,
withdrawal,
});

const proveHash = await walletClientL1.proveWithdrawal(proveArgs);

const proveReceipt = await publicClientL1.waitForTransactionReceipt({ hash: proveHash });

const awaitWithdrawal = await publicClientL1.waitToFinalize({
targetChain: walletClientL2.chain,
withdrawalHash: withdrawal.withdrawalHash,
});

const finalizeHash = await walletClientL1.finalizeWithdrawal({
targetChain: walletClientL2.chain,
withdrawal,
});

const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
hash: finalizeHash
});

const status = await publicClientL1.getWithdrawalStatus({
receipt,
targetChain: walletClientL2.chain
})
console.log('Withdrawal completed successfully!');
}

})()