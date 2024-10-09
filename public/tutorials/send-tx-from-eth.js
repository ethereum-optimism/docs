(async () => {

  const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
  const { optimismSepolia, sepolia } = require('viem/chains');
  const { privateKeyToAccount } = require('viem/accounts');
  
  const privateKey = process.env.TUTORIAL_PRIVATE_KEY;
  const account = privateKeyToAccount(privateKey);
  
  const l1PublicClient = createPublicClient({ chain: sepolia, transport: http("https://rpc.ankr.com/eth_sepolia") }).extend(publicActionsL1())
  const l2PublicClient = createPublicClient({ chain: optimismSepolia, transport: http("https://sepolia.optimism.io") }).extend(publicActionsL2());
  const l1WalletClient = createWalletClient({ chain: sepolia, transport: http("https://rpc.ankr.com/eth_sepolia") }).extend(walletActionsL1());
  const l2WalletClient = createWalletClient({ chain: optimismSepolia, transport: http("https://sepolia.optimism.io") }).extend(walletActionsL2())
  
  const address = account.address;
  const initialBalance = await l2PublicClient.getBalance({ address });
  console.log(`Initial balance: ${formatEther(initialBalance)} ETH`);
  
  const optimismPortalAbi = [
    {
      inputs: [
        { internalType: 'uint256', name: '_gasLimit', type: 'uint256' },
        { internalType: 'bytes', name: '_data', type: 'bytes' },
      ],
      name: 'depositTransaction',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
  ];
  
  const optimismPortalAddress = '0x1000000000000000000000000000000000000000';
  const gasLimit = 100000n;
  const data = '0x';
  const value = parseEther('0.000001');
  
  const gasEstimate = await l1PublicClient.estimateContractGas({
    address: optimismPortalAddress,
    abi: optimismPortalAbi,
    functionName: 'depositTransaction',
    args: [gasLimit, data],
    value,
  });
  
  const { hash: l1TxHash } = await l1WalletClient.writeContract({
    address: optimismPortalAddress,
    abi: optimismPortalAbi,
    functionName: 'depositTransaction',
    args: [gasLimit, data],
    value,
    gas: gasEstimate * 120n / 100n, // 20% buffer
  });
  
  console.log(`L1 transaction hash: ${l1TxHash}`);
  
  const l1Receipt = await l1PublicClient.waitForTransactionReceipt({ hash: l1TxHash });
  
  const l2TxHash = l1Receipt.logs[0].topics[1];
  const l2Receipt = await l2PublicClient.waitForTransactionReceipt({ hash: l2TxHash });
  console.log(`L2 transaction hash: ${l2TxHash}`);
  
  const finalBalance = await l2PublicClient.getBalance({ address });
  console.log(`Final balance: ${formatEther(finalBalance)} ETH`);
  
  const difference = initialBalance - finalBalance;
  console.log(`Difference: ${formatEther(difference)} ETH`);

})()
