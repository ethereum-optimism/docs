import {
  EAS,
  NO_EXPIRATION,
  SchemaEncoder,
  SchemaRegistry,
} from "@ethereum-attestation-service/eas-sdk"
 
import {
    createWalletClient,
    http,
    publicActions,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
 
import { JsonRpcProvider, Wallet } from "ethers"
 
import { interopAlpha0, supersimL2A } from '@eth-optimism/viem/chains'
 
// Contract addresses in all OP Stack blockchains
const EASContractAddress = "0x4200000000000000000000000000000000000021" 
const schemaRegistryContractAddress = "0x4200000000000000000000000000000000000020"
 
// Turn a viem wallet into an ethers provider
const walletClientToSigner = walletClient => {
  const chain = walletClient.chain
 
  // Get the RPC URL from the chain config (or supply your own)
  const rpcUrl = chain.rpcUrls?.default?.http?.[0]
  if (!rpcUrl) {
    throw new Error('RPC URL not found in chain configuration')
  }
 
  // Create a provider for the given chain
  const provider = new JsonRpcProvider(rpcUrl, chain.id)
 
  const signer = new Wallet(process.env.PRIVATE_KEY, provider)
  
  return signer
}
 
// Initialize the sdk with the address of the EAS Schema contract address
const eas = new EAS(EASContractAddress)
 
const schemaRegistry = new SchemaRegistry(schemaRegistryContractAddress)
 
const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const useSupersim = process.env.CHAIN_B_ID == 902
 
const wallet0 = createWalletClient({
    chain: useSupersim ? supersimL2A : interopAlpha0,
    transport: http(),
    account
}).extend(publicActions)
 
// Turn a viem wallet into an ethers provider
const signer0 = await walletClientToSigner(wallet0)
schemaRegistry.connect(signer0)
eas.connect(signer0)
 
const schema = "string name";
let schemaTxn, schemaUID
 
// Register the schema if needed, and get the schemaUID.
try {
    schemaTxn = await schemaRegistry.register({schema})    
    schemaUID = await schemaTxn.wait()
} catch (err) {
    // Schema is already registered
    if (err.info.error.data == "0x23369fa6")
        schemaUID = "0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58"
}
 
const schemaEncoder = new SchemaEncoder(schema)
const attestedData = schemaEncoder.encodeData([
  { name: "name", value: "Bill Hamm", type: "string" }
]);
 
const attestTxn = await eas.attest({
  schema: schemaUID,
  data: {
    recipient: "0x0123456789012345678901234567890123456789",
    expirationTime: NO_EXPIRATION,
    revocable: true, // Be aware that if your schema is not revocable, this MUST be false
    data: attestedData,
  },
})
 
// To get the attestation ID we'd use
// const attestationID = await transaction2.wait()
// However, here we need the attestation transaction's hash.
 
const request = await wallet0.prepareTransactionRequest(attestTxn.data)
const serializedTransaction = await wallet0.signTransaction(request)
const attestHash = await wallet0.sendRawTransaction({ serializedTransaction })
 
console.log(`export ATTEST_TXN=${attestHash}`)
