(async () => {

  const { createPublicClient, http } = require('viem');
  const { optimismSepolia, sepolia } = require('viem/chains');

  const L1_RPC_URL= "https://rpc.ankr.com/eth_sepolia";
  const L2_RPC_URL= "https://sepolia.optimism.io";
// Need to use Alchemy or something here because the getDepositsByAddress and
// getWithdrawalsByAddress functions use a large block range that the public RPC doesn't support
// because it uses Ankr. Maybe the SDK should be updated to use smaller block ranges depending
// on the RPC but that's a separate issue.

const l1RpcUrl = process.env.L1_RPC_URL;
const l2RpcUrl = process.env.L2_RPC_URL;

// Docs CI wallet, will have deposits and withdrawals.
const depositHash = '0x5896d6e4a47b465e0d925723bab838c62ef53468139a5e9ba501efd70f90cccb'
const withdrawalHash = '0x18b8b4022b8d9e380fd89417a2e897adadf31e4f41ca17442870bf89ad024f42'

const l1Client = createPublicClient({
  chain: sepolia,
  transport: http(l1RpcUrl),
});

const l2Client = createPublicClient({
  chain: optimismSepolia,
  transport: http(l2RpcUrl),
});

console.log('Grabbing deposit status...')
const depositStatus = await l2Client.getTransactionReceipt({ hash: depositHash });
console.log(depositStatus);

console.log('Grabbing deposit receipt...')
const depositReceipt = await l2Client.getTransaction({ hash: depositHash });
console.log(depositReceipt);

console.log('Grabbing deposit txn...')
const depositTransaction = await l2Client.getTransaction({ hash: depositHash });
console.log(depositTransaction);

console.log('Grabbing withdrawal status...')
const withdrawalStatus = await l1Client.getTransactionReceipt({ hash: withdrawalHash });
console.log(withdrawalStatus);

console.log('Grabbing withdrawal receipt...')
const withdrawalReceipt = await l1Client.getTransaction({ hash: withdrawalHash });
console.log(withdrawalReceipt);

console.log('Grabbing withdrawal txn...')
const withdrawalTransaction = await l1Client.getTransaction({ hash: withdrawalHash });
console.log(withdrawalTransaction);

})()
