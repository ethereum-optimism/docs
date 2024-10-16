(async () => {

  const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem');
  const { optimismSepolia, sepolia } = require('viem/chains');
  const { privateKeyToAccount } = require('viem/accounts');
  const { publicActionsL2, publicActionsL1, walletActionsL2, walletActionsL1, getL2TransactionHashes } = require ('viem/op-stack')
  
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

  const optimismPortalAddress = '0x5b47E1A08Ea6d985D6649300584e6722Ec4B1383';
  const gasLimit = 100000n;
  const data = '0x';
  const value = parseEther('0.000069420');
  
  const gasEstimate = await l1PublicClient.estimateContractGas({
      address: optimismPortalAddress,
      abi: optimismPortalAbi,
      functionName: 'depositTransaction',
      args: [gasLimit, data],
      value,
      account: account.address,
  });
  
  console.log(`Gas estimate: ${gasEstimate}`);

  // Step 3: Send the transaction
  const { request } = await l1PublicClient.simulateContract({
      account,
      address: optimismPortalAddress,
      abi: optimismPortalAbi,
      functionName: 'depositTransaction',
      args: [gasLimit, data],
      value,
      gas: gasEstimate * 120n / 100n, // 20% buffer
    })

  const l1TxHash = await l1WalletClient.writeContract(request)
  console.log(`L1 transaction hash: ${l1TxHash}`)

  // Step 4: Wait for the L1 transaction
  const l1Receipt = await l1PublicClient.waitForTransactionReceipt({hash: l1TxHash})
  console.log('L1 transaction confirmed:', l1Receipt)

  const [l2Hash] = getL2TransactionHashes(l1TxHash) 
  console.log(`Corresponding L2 transaction hash: ${l2Hash}`);

  const l2Receipt = await l2PublicClient.waitForTransactionReceipt({
      hash: l2Hash,
  }); 
  console.log('L2 transaction confirmed:', l2Receipt);

  const finalBalance = await l2Wallet.getBalance()
  console.log(`Final balance: ${formatEther(finalBalance)} ETH`);

  const difference = initialBalance - finalBalance
  console.log(`Difference in balance: ${formatEther(difference)} ETH`);

})()
