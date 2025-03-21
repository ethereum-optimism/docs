(async () => {
  const { createPublicClient, createWalletClient, http, parseUnits } = require('viem');
  const { privateKeyToAccount } = require('viem/accounts');
  const { sepolia } = require('viem/chains');
  const { opSepolia } = require('@eth-optimism/viem/chains');
  const { depositERC20, withdrawOptimismERC20 } = require('@eth-optimism/viem/actions');


  const PRIVATE_KEY = process.env.TUTORIAL_PRIVATE_KEY || '';
  const account = privateKeyToAccount(PRIVATE_KEY);

  const L1_RPC_URL = 'https://ethereum-sepolia.publicnode.com';
  const L2_RPC_URL = 'https://sepolia.optimism.io';

  const l1WalletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(L1_RPC_URL)
  });

  const l2WalletClient = createWalletClient({
    account,
    chain: opSepolia,
    transport: http(L2_RPC_URL)
  });

  const l1PublicClient = createPublicClient({
    chain: sepolia,
    transport: http(L1_RPC_URL)
  });

  const l2PublicClient = createPublicClient({
    chain: opSepolia,
    transport: http(L2_RPC_URL)
  });

  // Token addresses
  const L1_TOKEN_ADDRESS = '0x5589BB8228C07c4e15558875fAf2B859f678d129';
  const L2_TOKEN_ADDRESS = '0xD08a2917653d4E460893203471f0000826fb4034';

  // Define the ERC20 ABI 
  const ERC20_ABI = [
    {
      name: 'balanceOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: 'balance', type: 'uint256' }]
    },
    {
      name: 'approve',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      outputs: [{ name: 'success', type: 'bool' }]
    },
    {
      name: 'allowance',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' }
      ],
      outputs: [{ name: 'remaining', type: 'uint256' }]
    },
    {
      name: 'decimals',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'uint8' }]
    },
    {
      name: 'symbol',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'string' }]
    }
  ];

  async function bridgeTokensToL2(amount) {
    console.log("--- Starting L1 to L2 Token Bridge ---");
    const walletAddress = account.address;
    try {
      // Step 1: Check initial balances
      console.log("Checking initial balances...");
      const l1Balance = await l1PublicClient.readContract({
        address: L1_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      
      console.log(`L1 Token Balance: ${l1Balance}`);
      
      // We'll use bridge address from the chain configuration
      const bridgeAddress = opSepolia.contracts.l1StandardBridge[sepolia.id].address;
      console.log(`Using L1 Standard Bridge: ${bridgeAddress}`);
      const amountToBridge = parseUnits(amount, 18);
      
      const approveTx = await l1WalletClient.writeContract({
        address: L1_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [bridgeAddress, amountToBridge]
      });
      
      console.log(`Approval transaction hash: ${approveTx}`);
      
      // Wait for approval transaction to be relayed
      console.log("Waiting for approval to be confirmed...");
      const approveReceipt = await l1PublicClient.waitForTransactionReceipt({
        hash: approveTx
      });
      
      console.log(`Approval confirmed in block ${approveReceipt.blockNumber}`);
      
      // Bridge the tokens from L1 to L2 using depositERC20()
      console.log(`Bridging ${amount} tokens to L2...`);
      
      const depositTx = await depositERC20(l1WalletClient, {
        tokenAddress: L1_TOKEN_ADDRESS,
        remoteTokenAddress: L2_TOKEN_ADDRESS,
        amount: amountToBridge,
        targetChain: opSepolia,
        to: walletAddress,
        minGasLimit: 200000
      });
      
      console.log(`Bridge transaction hash: ${depositTx}`);
      
      // Wait for bridge transaction to be relayed on L1
      console.log("Waiting for bridge transaction to be confirmed on L1...");
      const depositReceipt = await l1PublicClient.waitForTransactionReceipt({
        hash: depositTx
      });
      
      console.log(`Bridge transaction confirmed in block ${depositReceipt.blockNumber}`);
      console.log("Token bridging initiated! The tokens will arrive on L2 in a few minutes.");
      
      console.log("Waiting for tokens to arrive on L2...");
          
      // Check L2 initial balance
      const initialL2Balance = await l2PublicClient.readContract({
        address: L2_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });

      console.log(`Initial L2 token balance: ${initialL2Balance}`);

      console.log("Checking initial balances...");
      const newl1Balance = await l1PublicClient.readContract({
        address: L1_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      
      console.log(`New L1 Token Balance: ${newl1Balance}`);

      console.log("Token bridge process complete!");
      
    } catch (error) {
      console.error("Error during bridging process:", error);
    }
  }

  // ====== withdrawTokensToL1() using withdrawOptimismERC20 ====== 

  async function withdrawTokensToL1(amount) {
    const walletAddress = account.address;
    
    try {
      // Check initial balances
      console.log("Checking initial balances...");
      
      const l2Balance = await l2PublicClient.readContract({
        address: L2_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      
      console.log(`L2 Token Balance: ${l2Balance}`);
      
      // Get the L2 Standard Bridge address
      const l2BridgeAddress = opSepolia.contracts.l2StandardBridge.address;
      console.log(`Using L2 Standard Bridge: ${l2BridgeAddress}`);
      
      const amountToWithdraw = parseUnits(amount, 18); 
      
      // Initiate the withdrawal using withdrawERC20
      console.log(`Withdrawing ${amount} tokens to L1...`);
      
      const withdrawTx = await withdrawOptimismERC20(l2WalletClient, {
        tokenAddress: L2_TOKEN_ADDRESS,
        amount: amountToWithdraw,
        to: walletAddress,
        minGasLimit: 200000,
      });
      
      console.log(`Withdrawal transaction hash: ${withdrawTx}`);
      
      //Wait for withdraw transaction to be confirmed on L2
      console.log("Waiting for withdrawal transaction to be confirmed on L2...");
      const withdrawReceipt = await l2PublicClient.waitForTransactionReceipt({
        hash: withdrawTx
      });
      
      console.log(`Withdrawal initiated in L2 block ${withdrawReceipt.blockNumber}`);
      console.log("Withdrawal process initiated! It will take 7 days for the tokens to be available on L1.");
      console.log("This is due to the 7-day dispute period required for the security of the Optimism bridge.");
      
      // Check L2 balance after withdrawal
      const updatedL2Balance = await l2PublicClient.readContract({
        address: L2_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });
      
      console.log(`Updated L2 token balance: ${updatedL2Balance}`);
      
    } catch (error) {
      console.error("Error during withdrawal process:", error);
    }
  }

  // Execute both functions
  console.log("Running deposit and withdrawal operations...");
  
  // Deposit tokens
  await bridgeTokensToL2("0.1");
  
  // Wait a bit before starting withdrawal to ensure tokens have arrived
  console.log("Waiting 60 seconds before initiating withdrawal...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Withdraw tokens
  await withdrawTokensToL1("0.01");
  
  console.log("Bridge operations completed!");
})();