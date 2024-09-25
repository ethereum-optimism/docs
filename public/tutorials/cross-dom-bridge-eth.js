import { createPublicClient, http, createWalletClient, parseEther } from 'viem';
import { sepolia, optimismSepolia } from "viem/chains";
import { privateKeyToAccount } from 'viem/accounts';
import { getL2TransactionHashes, publicActionsL2, walletActionsL1, walletActionsL2 } from 'viem/op-stack';

// Replace with your actual private key (Keep this secure!)
const PRIVATE_KEY = '0x....'
const account = privateKeyToAccount(PRIVATE_KEY);

// Create L1 public client for reading from the Sepolia network
const publicClientL1 = createPublicClient({
    chain: sepolia,
    transport: http(),
});

// Create L1 wallet client for sending transactions on Sepolia
const walletClientL1 = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
}).extend(walletActionsL1());

// Create L2 public client for interacting with OP Sepolia
const publicClientL2 = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://rpc.ankr.com/eth_sepolia'),
}).extend(publicActionsL2());

// Create L2 wallet client for sending transactions on OP Sepolia
const walletClientL2 = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http('https://rpc.ankr.com/eth_sepolia'),
}).extend(walletActionsL2());

async function depositETH(amount) {
try {
    // Build the deposit transaction parameters
    const args = await publicClientL2.buildDepositTransaction({
        mint: parseEther(amount), // Convert amount to wei
        to: account.address, // Recipient on L2 (same as sender in this case)
    });

    // Execute the deposit transaction on L1
    const hash = await walletClientL1.depositTransaction(args);
    console.log(`Deposit transaction hash on L1: ${hash}`);

    // Wait for the L1 transaction to be confirmed
    const receipt = await publicClientL1.waitForTransactionReceipt({ hash });
    console.log('L1 transaction confirmed:', receipt);

    // Extract the corresponding L2 transaction hash
    const l2Hashes = getL2TransactionHashes(receipt);
    console.log(`Corresponding L2 transaction hash: ${l2Hashes}`);

    // Wait for the L2 transaction to be confirmed
    const l2Receipt = await publicClientL2.waitForTransactionReceipt({
        hash: l2Hashes,
    });
    console.log('L2 transaction confirmed:', l2Receipt);

    console.log('Deposit completed successfully!');
    } catch (error) {
        console.error('Error during deposit:', error);
    }
}