(async () => {

  const viem = await import('viem');
  const { createPublicClient, createWalletClient, http, formatEther } = viem;
  const accounts = await import('viem/accounts');
  const { privateKeyToAccount } = accounts;
  const viemChains = await import('viem/chains');
  const { optimismSepolia, sepolia } = viemChains;
  const opActions = await import('@eth-optimism/viem/actions');
  const { depositERC20, withdrawOptimismERC20 } = opActions;
  
  const l1Token = "0x5589BB8228C07c4e15558875fAf2B859f678d129";
  const l2Token = "0xD08a2917653d4E460893203471f0000826fb4034";
  const oneToken = 1000000000000000000n
  
  const PRIVATE_KEY = process.env.TUTORIAL_PRIVATE_KEY || '';
  const account = privateKeyToAccount(PRIVATE_KEY);

  const L1_RPC_URL = 'https://rpc.ankr.com/eth_sepolia/<YOU_API_KEY>';
  const L2_RPC_URL = 'https://sepolia.optimism.io';
  
  const publicClientL1 = createPublicClient({
    chain: sepolia,
    transport: http(L1_RPC_URL),
  });
  
  const walletClientL1 = createWalletClient({
    account,
    chain: sepolia,
    transport: http(L1_RPC_URL),
  });
  
  const publicClientL2 = createPublicClient({
    chain: optimismSepolia,
    transport: http(L2_RPC_URL),
  });
  
  const walletClientL2 = createWalletClient({
    account,
    chain: optimismSepolia,
    transport: http(L2_RPC_URL),
  });
  
  const erc20ABI = [
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "faucet",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address"
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256"
        }
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool"
        }
      ],
      stateMutability: "nonpayable",
      type: "function"
    },
  ];
  
  console.log('Getting tokens from faucet...');
  const tx = await walletClientL1.writeContract({
    address: l1Token,
    abi: erc20ABI,
    functionName: 'faucet',
    account,
  });
  console.log('Faucet transaction:', tx);
  
  // Wait for the transaction to be mined
  await publicClientL1.waitForTransactionReceipt({ hash: tx });
  
  const l1Balance = await publicClientL1.readContract({
    address: l1Token,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log(`L1 Balance after receiving faucet: ${formatEther(l1Balance)}`);

  console.log('Approving tokens for bridge...');
  const bridgeAddress = optimismSepolia.contracts.l1StandardBridge[sepolia.id].address;
  const approveTx = await walletClientL1.writeContract({
    address: l1Token,
    abi: erc20ABI,
    functionName: 'approve',
    args: [bridgeAddress, oneToken],
  });
  console.log('Approval transaction:', approveTx);
  
  // Wait for approval transaction to be mined
  await publicClientL1.waitForTransactionReceipt({ hash: approveTx });
  
  console.log('Depositing tokens to L2...');
  const depositTx = await depositERC20(walletClientL1, {
    tokenAddress: l1Token,
    remoteTokenAddress: l2Token,
    amount: oneToken,
    targetChain: optimismSepolia,
    to: account.address,
    minGasLimit: 200000,
  });
  console.log(`Deposit transaction hash: ${depositTx}`);
  
  const depositReceipt = await publicClientL1.waitForTransactionReceipt({ hash: depositTx });
  console.log(`Deposit confirmed in block ${depositReceipt.blockNumber}`);
  console.log("Token bridging initiated! The tokens will arrive on L2 in a few minutes.");
  
  console.log('Waiting for tokens to arrive on L2...');

  await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
  const l1BalanceAfterDeposit = await publicClientL1.readContract({
    address: l1Token,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log(`L1 Balance after deposit: ${formatEther(l1BalanceAfterDeposit)}`);

  const l2BalanceAfterDeposit = await publicClientL2.readContract({
    address: l2Token,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log(`L2 Balance after deposit: ${formatEther(l2BalanceAfterDeposit)}`);
  
  console.log('Withdrawing tokens back to L1...');
  const withdrawTx = await withdrawOptimismERC20(walletClientL2, {
    tokenAddress: l2Token,
    amount: oneToken / 2n, 
    to: account.address,
    minGasLimit: 200000,
  });
  console.log(`Withdrawal transaction hash: ${withdrawTx}`);
  
  const withdrawReceipt = await publicClientL2.waitForTransactionReceipt({ hash: withdrawTx });
  console.log(`Withdrawal initiated in L2 block ${withdrawReceipt.blockNumber}`);
  console.log("Withdrawal process initiated! It will take 7 days for the tokens to be available on L1.");

  const l2Balance = await publicClientL2.readContract({
    address: l2Token,
    abi: erc20ABI,
    functionName: 'balanceOf',
    args: [account.address]
  });
  console.log(`L2 Balance after withdrawal: ${formatEther(l2Balance)}`);
  
})();
