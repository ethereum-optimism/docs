# Deployer

`op-deployer` simplifies the process of deploying the OP Stack. It works similarly to [Terraform](https://www.terraform.io/). Like Terraform, you define a declarative config file called an "**intent**," then run a command to apply the intent to your chain. `op-deployer` will compare the state of your chain against the intent, and make whatever changes are necessary for them to match. In its current state, it is intended to deploy new standard chains that utilize the Superchain wide contracts.

## Installation

There are multiple ways to install `op-deployer`:

### Option 1: Download pre-built binary (Recommended)

The recommended way to install `op-deployer` is to download the latest release from the monorepo's [release page](https://github.com/ethereum-optimism/optimism/releases).

1. Go to https://github.com/ethereum-optimism/optimism/releases
2. Find the latest release that includes op-deployer
3. Download the appropriate binary for your operating system
4. Extract the binary to a location on your system PATH

    
5. Verify installation:
    
    ```bash
    op-deployer --version
    ```
    

### Option 2: Build from source

If you prefer to build from source:

1. Clone the Optimism repository:
    
    ```bash
    git clone https://github.com/ethereum-optimism/optimism.git
    cd optimism
    ```
    
2. Build the op-deployer binary:
    
    ```bash
    make op-deployer
    ```
    
3. The binary will be available at `./bin/op-deployer`

## Deployment usage

> ⚠️ WARNING: Gas cost ⚠️
> 
> 
> Deploying an OP Stack chain can require significant gas. Ensure your deployer wallet has at least 3.5 ETH for deployment on mainnet or testnet. The exact amount will vary based on gas prices and configuration.
> 

The base use case for `op-deployer` is deploying new OP Chains. This process is broken down into four steps:

### `init`: configure your chain

To get started with `op-deployer`, create an intent file that defines your desired chain configuration. Use the built-in `op-deployer` utility to generate this file:

> 📌 op-deployer uses a declarative intent file to determine how a new chain should be configured. Then, it runs through a deployment pipeline to actually deploy the chain.
> 

```bash
./bin/op-deployer init --l1-chain-id 11155111 --l2-chain-ids <l2-chain-id> --workdir .deployer

```

Replace `<l2-chain-id>` with the exact value.

This command will create a directory called `.deployer` in your current working directory containing the intent file and an empty `state.json` file. `state.json` is populated with the results of your deployment, and never needs to be edited directly.

Your intent file will need to be modified to your parameters, but it will initially look something like this:

> ⚠️ Do not use the default addresses in the intent for a production chain! They are generated from the test... junk mnemonic. Any funds they hold will be stolen on a live chain.
> 

```toml
deploymentStrategy = "live"
configType = "standard-overrides"
l1ChainID = 11155111# The chain ID of Sepolia (L1) you'll be deploying to.
fundDevAccounts = true# Whether or not to fund dev accounts using the test... junk mnemonic on L2.
l1ContractsLocator = "tag://op-contracts/v1.8.0-rc.4"# L1 smart contracts versions
l2ContractsLocator = "tag://op-contracts/v1.7.0-beta.1+l2-contracts"# L2 smart contracts versions# Delete this table if you are using the shared Superchain contracts on the L1# If you are deploying your own SuperchainConfig and ProtocolVersions contracts, fill in these details
[superchainRoles]
  proxyAdminOwner = "0x1eb2ffc903729a0f03966b917003800b145f56e2"
  protocolVersionsOwner = "0x79add5713b383daa0a138d3c4780c7a1804a8090"
  guardian = "0x7a50f00e8d05b95f98fe38d8bee366a7324dcf7e"

# List of L2s to deploy. op-deployer can deploy multiple L2s at once
[[chains]]
# Your chain's ID, encoded as a 32-byte hex string
  id = "0x00000000000000000000000000000000000000000000000000000a25406f3e60"
# Update the fee recipient contract
  baseFeeVaultRecipient = "0x100f829718B5Be38013CC7b29c5c62a08D00f1ff"
  l1FeeVaultRecipient = "0xbAEaf33e883068937aB4a50871f2FD52e241013A"
  sequencerFeeVaultRecipient = "0xd0D5D18F0ebb07B7d728b14AAE014eedA814d6BD"
  eip1559DenominatorCanyon = 250
  eip1559Denominator = 50
  eip1559Elasticity = 6
# Various ownership roles for your chain. When you use op-deployer init, these roles are generated using the# test... junk mnemonic. You should replace these with your own addresses for production chains.
  [chains.roles]
    l1ProxyAdminOwner = "0xdf5a644aed1b5d6cE0DA2aDd778bc5f39d97Ac88"
    l2ProxyAdminOwner = "0xC40445CD88dDa2A410F86F6eF8E00fd52D8381FD"
    systemConfigOwner = "0xB32296E6929F2507dB8153A64b036D175Ac6E89e"
    unsafeBlockSigner = "0xA53526b516df4eEe3791734CE85311569e0eAD78"
    batcher = "0x8680d36811420359093fd321ED386a6e76BE2AF3"
    proposer = "0x41b3B204099771aDf857F826015703A1030b6675"
    challenger = "0x7B51A480dAeE699CA3a4F68F9AAA434452112eF7"

```

### Understanding the intent.toml fields

Here's an explanation of the key fields in the intent file:

**Global configuration:**

- `deploymentStrategy`: Used to deploy both to live chains and L1 genesis files. Valid values are `live` and `genesis`.
- `configType`: Type of configuration to use ("standard-overrides" is most common)
- `l1ChainID`: The chain ID of the L1 network you're deploying to
- `fundDevAccounts`: Whether to fund development accounts on L2 (set to false for production)
- `l1ContractsLocator`: The version of L1 contracts to deploy
- `l2ContractsLocator`: The version of L2 contracts to deploy

**Superchain roles:**

- `proxyAdminOwner`: Address that can upgrade Superchain-wide contracts
- `protocolVersionsOwner`: Address that can update protocol versions
- `guardian`: Address authorized to pause L1 withdrawals from contracts, blacklist dispute games, and set the respected game type in the `OptimismPortal`

**Chain-specific configuration:**

- `id`: Unique identifier for your chain
- `baseFeeVaultRecipient`: Address that represents the recipient of fees accumulated in the `BaseFeeVault`
- `l1FeeVaultRecipient`: Address that represents the recipient of fees accumulated in the `L1FeeVault`
- `sequencerFeeVaultRecipient`: Address that receives sequencer fees
- `eip1559DenominatorCanyon`, `eip1559Denominator`, `eip1559Elasticity`: Parameters for fee calculation

**Chain roles:**

- `l1ProxyAdminOwner`: Address authorized to update the L1 Proxy Admin
- `l2ProxyAdminOwner`: Address authorized to upgrade protocol contracts via calls to the `ProxyAdmin`. This is the aliased L1 ProxyAdmin owner address.
- `systemConfigOwner`: Address authorized to change values in the `SystemConfig` contract. All configuration is stored on L1 and picked up by L2 as part of the [derivation](https://specs.optimism.io/protocol/derivation.html) of the L2 chain
- `unsafeBlockSigner`: Address which authenticates the unsafe/pre-submitted blocks for a chain at the P2P layer
- `batcher`: Address that batches transactions from L2 to L1
- `proposer`: Address which can create and interact with [permissioned dispute games](https://specs.optimism.io/fault-proof/stage-one/bridge-integration.html#permissioned-faultdisputegame) on L1.
- `challenger`: Address Account which can interact with existing permissioned dispute games

### Contract locator schemes

op-deployer uses contract locators to find contract artifacts to deploy. 
Locators are just URLs under the hood.
The `l1ContractsLocator` and `l2ContractsLocator` fields support several schemes for specifying where to find the contract implementations:

* `tag://` - References a specific tagged release of the contracts (e.g., `tag://op-contracts/v1.8.0-rc.4`). In this case, the contracts bytecode will be downloaded from a fixed bytecode bundle on GCS.
* `file://` - Points to a local Forge build artifacts directory. Must point to the `forge-artifacts` directory containing the compiled contract artifacts.
This is useful for local development, since you can point it at your local monorepo 
e.g. `--artifacts-locator file:///Users/username/code/optimism/packages/contracts-bedrock/forge-artifacts/`
* `http://` or `https://` - Points to a target directory containing contract artifacts. The URL should directly reference the directory containing the `forge-artifacts` directory, in this case, the bytecode will be downloaded from the URL specified.

<Callout type="warning">
When using any scheme other than `tag://`, you must set `configType` to either `custom` or `standard-overrides` in your intent file.
</Callout>

For example:

```toml
# When using tag:// scheme
configType = "standard-overrides"
l1ContractsLocator = "tag://op-contracts/v1.8.0-rc.4"
l2ContractsLocator = "tag://op-contracts/v1.7.0-beta.1+l2-contracts"

# When using other schemes (file://, http://, https://)
configType = "custom"  # or "standard-overrides"
l1ContractsLocator = "file:///path/to/local/op-contracts/v1.8.0-rc.4/forge-artifacts"
l2ContractsLocator = "https://example.com/op-contracts/v1.7.0-beta.1+l2-contracts.tar.gz"
```

By default, `op-deployer` will fill in all other configuration variables with those that match the [standard configuration](https://specs.optimism.io/protocol/configurability.html?utm_source=op-docs&utm_medium=docs). You can override these default settings by adding them to your intent file using the table below:

```toml
[globalDeployOverrides]
  l2BlockTime = 1# 1s L2blockTime is also standard, op-deployer defaults to 2s

```

You can also do chain by chain configurations in the `chains` table.

### `apply`: deploy your chain

> 📌 Hardware wallets are not supported, but you can use ephemeral hot wallets since this deployer key has no privileges.
> 

Now that you've created your intent file, you can apply it to your chain to deploy the L1 smart contracts:

```bash
bash
[ ]

./bin/op-deployer apply --workdir .deployer --l1-rpc-url <rpc-url> --private-key <private key hex>

```

- Replace `<rpc-url>` with your `L1_RPC_URL` and `<private key>` with your private key

This command will deploy the OP Stack to L1. It will deploy all L2s specified in the intent file. Superchain
configuration will be set to the Superchain-wide defaults - i.e., your chain will be opted into the [Superchain pause](https://specs.optimism.io/protocol/superchain-config.html#pausability)
and will use the same [protocol versions](https://github.com/ethereum-optimism/specs/blob/main/specs/protocol/superchain-upgrades.md)
address as other chains on the Superchain.

### `verify`: verify contract source code on block explorers

After deploying your contracts, you can verify them on block explorers like Etherscan:

```bash
op-deployer verify --workdir .deployer --l1-rpc-url <rpc-url> --l1-explorer-api-url <explorer-api-url> --l1-explorer-api-key <explorer-api-key>

```

The verification tool supports various options:

- `-workdir`: Specifies the directory containing the deployment state
- `-l1-rpc-url`: RPC URL for the L1 chain
- `-l1-explorer-api-url`: API URL for the L1 block explorer (e.g., https://api-sepolia.etherscan.io/api for Sepolia)
- `-l1-explorer-api-key`: API key for the L1 block explorer
- `-retry`: Retry failed verifications
- `-overwrite`: Overwrite existing verifications
- `-skip-already-verified`: Skip contracts that are already verified
- `-retries`: Number of retries for failed verifications (default: 3)
- `-retry-delay`: Delay between retries in seconds (default: 1s)
- `-timeout`: Timeout for verification requests in seconds (default: 30s)
- `-contract-filter`: Regex filter for contract names to verify

Example usage:

```bash
op-deployer verify --workdir .deployer \
  --l1-rpc-url https://sepolia.infura.io/v3/YOUR_INFURA_KEY \
  --l1-explorer-api-url https://api-sepolia.etherscan.io/api \
  --l1-explorer-api-key YOUR_ETHERSCAN_API_KEY \
  --skip-already-verified

```

### `inspect`: generate genesis files and chain information

> 📌 To add your chain to the Superchain Registry you will need to provide the chain artifacts. To get these chain artifacts, you will need to write the output of these commands to new files.
> 

Inspect the `state.json` file by navigating to your working directory. With the contracts deployed, generate the genesis and rollup configuration files by running the following commands:

```bash
./bin/op-deployer inspect genesis --workdir .deployer <l2-chain-id> > .deployer/genesis.json
./bin/op-deployer inspect rollup --workdir .deployer <l2-chain-id> > .deployer/rollup.json

```

Now that you have your `genesis.json` and `rollup.json` you can spin up a node on your network. You can also use the following inspect subcommands to get additional chain artifacts:

```bash
bash
[ ]

./bin/op-deployer inspect l1 --workdir .deployer <l2-chain-id># outputs all L1 contract addresses for an L2 chain
./bin/op-deployer inspect deploy-config --workdir .deployer <l2-chain-id># outputs the deploy config for an L2 chain
./bin/op-deployer inspect l2-semvers --workdir .deployer <l2-chain-id># outputs the semvers for all L2 chains

```

## Bootstrap usage

The bootstrap commands are specialized tools primarily used for initializing a new superchain on an L1 network that hasn't previously hosted one.

### Available commands

```bash
op-deployer bootstrap superchain --l1-chain-id <l1-chain-id> --private-key <private-key> --l1-rpc-url <l1-rpc-url>
op-deployer bootstrap implementations
op-deployer bootstrap proxy

```

### Bootstrap workflow

The bootstrap workflow involves several steps to initialize a new superchain:

> 📌 TODO: Add detailed step-by-step instructions for a successful bootstrap flow, including expected order of operations and dependencies between commands.
> 

When using the bootstrap command, you'll need to specify the following parameters:

- `-l1-chain-id`: The chain ID of the L1 network
- `-private-key`: The private key to use for deployment
- `-l1-rpc-url`: The RPC URL for the L1 network

### MIPS Version

> 📌 TODO: Document the expected format and supported values for the MIPS version parameter.
> 

