(async () => {

  const viem = await import('viem');
  const { parseEther } = viem;
  const { privateKeyToAccount } = accounts;

  //Replace <YOU_API_KEY> with your API keys
  const L1_RPC_URL = 'https://rpc.ankr.com/eth_sepolia/<YOU_API_KEY>';
  const L2_RPC_URL = 'https://sepolia.optimism.io';

  const PRIVATE_KEY = process.env.TUTORIAL_PRIVATE_KEY;
  const accounts = privateKeyToAccount(PRIVATE_KEY);
  
  const publicClientL1 = createPublicClient({
    chain: sepolia,
    transport: http(L1_RPC_URL),
  });
  
  const publicClientL2 = createPublicClient({
    chain: optimismSepolia,
    transport: http(L2_RPC_URL),
  });
  
  const walletClientL2 = createWalletClient({
    accounts,
    chain: optimismSepolia,
    transport: http(L2_RPC_URL),
  });
  
// Build parameters to initiate the withdrawal transaction
const args = await publicClientL1.buildInitiateWithdrawal({
  to: accounts.address,
  value: parseEther('1')
})
 
// Execute the initiate withdrawal transaction on the L2
const hash = await walletClientL2.initiateWithdrawal(args)
 
// Wait for the initiate withdrawal transaction receipt
const receipt = await publicClientL2.waitForTransactionReceipt({ hash })
 
// Wait until the withdrawal is ready to prove
const { output, withdrawal } = await publicClientL1.waitToProve({
  receipt,
  targetChain: walletClientL2.chain
})
 
// Build parameters to prove the withdrawal
const proveArgs = await publicClientL2.buildProveWithdrawal({
  output,
  withdrawal
})
 
// Prove the withdrawal on the L1
const proveHash = await walletClientL1.proveWithdrawal(proveArgs)
 
// Wait until the prove withdrawal is processed
const proveReceipt = await publicClientL1.waitForTransactionReceipt({
  hash: proveHash
})
 
// Wait until the withdrawal is ready to finalize
await publicClientL1.waitToFinalize({
  targetChain: walletClientL2.chain,
  withdrawalHash: withdrawal.withdrawalHash
})
 
// Finalize the withdrawal
const finalizeHash = await walletClientL1.finalizeWithdrawal({
  targetChain: walletClientL2.chain,
  withdrawal
})
 
// Wait until the withdrawal is finalized
const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
  hash: finalizeHash
})
 
console.log('Withdrawal completed successfully!')
  
})();
