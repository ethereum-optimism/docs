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
5. Make the binary executable (on Unix-based systems):
    
    ```bash
    chmod +x /path/to/op-deployer
    ```
    
6. Verify installation:
    
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

The base use case for `op-deployer` is deploying new OP Chains. This process is broken down into three steps:

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

- `configType`: Type of configuration to use ("standard-overrides" is most common)
- `l1ChainID`: The chain ID of the L1 network you're deploying to
- `fundDevAccounts`: Whether to fund development accounts on L2 (set to false for production)
- `l1ContractsLocator`: The version of L1 contracts to deploy
- `l2ContractsLocator`: The version of L2 contracts to deploy

**Superchain roles:**

- `proxyAdminOwner`: Address that can upgrade Superchain-wide contracts
- `protocolVersionsOwner`: Address that can update protocol versions
- `guardian`: Address with emergency powers (e.g., pausing withdrawals)

**Chain-specific configuration:**

- `id`: Unique identifier for your chain
- `baseFeeVaultRecipient`: Address that receives base fees
- `l1FeeVaultRecipient`: Address that receives L1 fees
- `sequencerFeeVaultRecipient`: Address that receives sequencer fees
- `eip1559DenominatorCanyon`, `eip1559Denominator`, `eip1559Elasticity`: Parameters for fee calculation

**Chain roles:**

- `l1ProxyAdminOwner`: Address that owns the L1 proxy admin contract
- `l2ProxyAdminOwner`: Address that owns the L2 proxy admin contract
- `systemConfigOwner`: Address that can update system configuration
- `unsafeBlockSigner`: Address that signs blocks in unsafe mode
- `batcher`: Address that batches transactions from L2 to L1
- `proposer`: Address that proposes output roots
- `challenger`: Address that can challenge invalid output roots

By default, `op-deployer` will fill in all other configuration variables with those that match the [standard configuration](https://specs.optimism.io/protocol/configurability.html?utm_source=op-docs&utm_medium=docs). You can override these default settings by adding them to your intent file using the table below:

```toml
toml
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
bash
[ ]

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
bash
[ ]

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
bash
[ ]

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

# Bootstrap usage

`op-deployer` provides a set of bootstrap commands specifically designed for initializing a new superchain on an L1 network. These commands are essential when you're setting up a completely new superchain environment rather than deploying a new chain on an existing superchain.

## Bootstrap process overview

When bootstrapping a new superchain, you typically need to follow this process:

1. **Deploy proxy admin** (`bootstrap proxy`): Sets up the `ERC-1967` proxy for the superchain management contracts.
2. **Deploy Superchain configuration** (`bootstrap superchain`): Creates the foundational superchain configuration contracts.
3. **Deploy implementations** (`bootstrap implementations`): Deploys the implementation contracts needed for the dispute system.
4. **Deploy validator** (`bootstrap validator`): Deploys the `StandardValidator` for the superchain.

## Bootstrap proxy

The `bootstrap proxy` command deploys a new `ERC-1967` proxy admin, which is required for upgradeability of the superchain contracts.

### Command usage

```bash
op-deployer bootstrap proxy \
  --l1-rpc-url <L1_RPC_ENDPOINT> \
  --private-key <PRIVATE_KEY> \
  --artifacts-locator <ARTIFACTS_LOCATOR> \
  --proxy-owner <PROXY_OWNER_ADDRESS> \
  --outfile proxy-output.json

```

### Parameters

```
ParameterDescriptionRequiredExample--l1-rpc-urlRPC URL for the L1 chainYeshttps://sepolia.infura.io/v3/YOUR_API_KEY--private-keyPrivate key for transaction signingYes0xabcd...1234--artifacts-locatorLocation of contract artifactsYesfile:///path/to/artifacts ortag://op-contracts/v1.8.0-rc.4--proxy-ownerAddress that will own the proxyYes0x1234...abcd--outfileFile to write output JSONNoproxy-output.json--cache-dirDirectory to cache artifactsNo.artifacts-cache
```

### Example

```bash
bash
[ ]

op-deployer bootstrap proxy \
  --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key 0xYOUR_PRIVATE_KEY \
  --artifacts-locator file:///path/to/artifacts \
  --proxy-owner 0xYOUR_OWNER_ADDRESS \
  --outfile proxy-output.json

```

### Output

The command outputs a JSON file containing the deployed proxy contract address:

```json
json
[ ]

{
  "ProxyAdmin": "0x123...abc"
}

```

## Bootstrap Superchain

The `bootstrap superchain` command initializes the core superchain configuration contracts that govern the entire superchain ecosystem.

### Command Usage

```bash
bash
[ ]

op-deployer bootstrap superchain \
  --l1-rpc-url <L1_RPC_ENDPOINT> \
  --private-key <PRIVATE_KEY> \
  --artifacts-locator <ARTIFACTS_LOCATOR> \
  --superchain-proxy-admin-owner <ADMIN_OWNER_ADDRESS> \
  --protocol-versions-owner <VERSIONS_OWNER_ADDRESS> \
  --guardian <GUARDIAN_ADDRESS> \
  --paused <true|false> \
  --required-protocol-version <VERSION> \
  --recommended-protocol-version <VERSION> \
  --outfile superchain-output.json

```

### Parameters

```
ParameterDescriptionRequiredExample--l1-rpc-urlRPC URL for the L1 chainYeshttps://sepolia.infura.io/v3/YOUR_API_KEY--private-keyPrivate key for transaction signingYes0xabcd...1234--artifacts-locatorLocation of contract artifactsYesfile:///path/to/artifacts ortag://op-contracts/v1.8.0-rc.4--superchain-proxy-admin-ownerAddress that owns the superchain proxy adminYes0x1234...abcd--protocol-versions-ownerAddress that can update protocol versionsYes0x2345...bcde--guardianAddress with emergency powersYes0x3456...cdef--pausedWhether the superchain starts pausedNo (defaults to false)false--required-protocol-versionMinimum required protocol versionYes1.0.0--recommended-protocol-versionRecommended protocol versionYes1.0.0--outfileFile to write output JSONNo (defaults to stdout)superchain-output.json--cache-dirDirectory to cache artifactsNo.artifacts-cache
```

### Example

```bash
bash
[ ]

op-deployer bootstrap superchain \
  --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key 0xYOUR_PRIVATE_KEY \
  --artifacts-locator file:///path/to/artifacts \
  --superchain-proxy-admin-owner 0xADMIN_OWNER_ADDRESS \
  --protocol-versions-owner 0xVERSIONS_OWNER_ADDRESS \
  --guardian 0xGUARDIAN_ADDRESS \
  --paused false \
  --required-protocol-version 1.0.0 \
  --recommended-protocol-version 1.0.0 \
  --outfile superchain-output.json

```

### Output

The command outputs a JSON file containing the deployed superchain contract addresses:

```json
json
[ ]

{
  "SuperchainConfig": "0x123...abc",
  "ProtocolVersions": "0x456...def"
}

```

## Bootstrap Implementations

The `bootstrap implementations` command deploys the implementation contracts required for the dispute system of the OP Stack.

### Command Usage

```bash
bash
[ ]

op-deployer bootstrap implementations \
  --l1-rpc-url <L1_RPC_ENDPOINT> \
  --private-key <PRIVATE_KEY> \
  --artifacts-locator <ARTIFACTS_LOCATOR> \
  --l1-contracts-release <RELEASE_VERSION> \
  --mips-version <1|2> \
  --withdrawal-delay-seconds <SECONDS> \
  --min-proposal-size-bytes <BYTES> \
  --challenge-period-seconds <SECONDS> \
  --proof-maturity-delay-seconds <SECONDS> \
  --dispute-game-finality-delay-seconds <SECONDS> \
  --superchain-config-proxy <ADDRESS> \
  --protocol-versions-proxy <ADDRESS> \
  --upgrade-controller <ADDRESS> \
  --use-interop <true|false> \
  --outfile implementations-output.json

```

### Parameters

```
ParameterDescriptionRequiredDefaultExample--l1-rpc-urlRPC URL for the L1 chainYes-https://sepolia.infura.io/v3/YOUR_API_KEY--private-keyPrivate key for transaction signingYes-0xabcd...1234--artifacts-locatorLocation of contract artifactsYes-file:///path/to/artifacts--l1-contracts-releaseVersion tag for L1 contractsYes-v1.8.0-rc.4--mips-versionMIPS version for the fault proof system (1 or 2)NoFrom standard config2--withdrawal-delay-secondsDelay for withdrawals in secondsNoFrom standard config604800 (1 week)--min-proposal-size-bytesMinimum size for proposals in bytesNoFrom standard config1--challenge-period-secondsChallenge period in secondsNoFrom standard config604800 (1 week)--proof-maturity-delay-secondsProof maturity delay in secondsNoFrom standard config60--dispute-game-finality-delay-secondsDispute game finality delay in secondsNoFrom standard config604800 (1 week)--superchain-config-proxyAddress of superchain config proxyYes-Result from superchain command--protocol-versions-proxyAddress of protocol versions proxyYes-Result from superchain command--upgrade-controllerAddress of upgrade controllerYes-0x0000...0000--use-interopWhether to enable interoperability featuresNofalsetrue--outfileFile to write output JSONNostdoutimplementations-output.json--cache-dirDirectory to cache artifactsNo-.artifacts-cache
```

### Understanding MIPS Version

The MIPS version parameter determines which version of the Cannon MIPS VM to use for fault proofs:

- **MIPS Version 1**: Original implementation, suitable for most deployments
- **MIPS Version 2**: Enhanced implementation with optimizations, generally preferred for new deployments

For most new deployments, MIPS Version 2 is recommended unless you have specific compatibility requirements.

### Example

```bash
bash
[ ]

op-deployer bootstrap implementations \
  --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key 0xYOUR_PRIVATE_KEY \
  --artifacts-locator file:///path/to/artifacts \
  --l1-contracts-release v1.8.0-rc.4 \
  --mips-version 2 \
  --withdrawal-delay-seconds 604800 \
  --min-proposal-size-bytes 1 \
  --challenge-period-seconds 604800 \
  --proof-maturity-delay-seconds 60 \
  --dispute-game-finality-delay-seconds 604800 \
  --superchain-config-proxy 0xSUPERCHAIN_CONFIG_ADDRESS \
  --protocol-versions-proxy 0xPROTOCOL_VERSIONS_ADDRESS \
  --upgrade-controller 0x0000000000000000000000000000000000000000 \
  --outfile implementations-output.json

```

### Output

The command outputs a JSON file containing the deployed implementation contract addresses:

```json
json
[ ]

{
  "L1CrossDomainMessenger": "0x123...abc",
  "L1ERC721Bridge": "0x234...bcd",
  "L1StandardBridge": "0x345...cde",
  "L2OutputOracle": "0x456...def",
  "OptimismPortal": "0x567...efg",
  "OptimismMintableERC20Factory": "0x678...fgh",
  "AddressManager": "0x789...ghi",
  "ProxyAdmin": "0x89a...hij",
  "SystemConfig": "0x9ab...ijk",
  "DisputeGameFactory": "0xabc...jkl"
}

```

## Bootstrap Validator

The `bootstrap validator` command deploys the validator contracts required for the superchain. This is typically done after deploying the implementations.

### Command Usage

```bash
bash
[ ]

op-deployer bootstrap validator \
  --l1-rpc-url <L1_RPC_ENDPOINT> \
  --private-key <PRIVATE_KEY> \
  --artifacts-locator <ARTIFACTS_LOCATOR> \
  --config <CONFIG_FILE_PATH> \
  --outfile validator-output.json

```

### Parameters

```
ParameterDescriptionRequiredExample--l1-rpc-urlRPC URL for the L1 chainYeshttps://sepolia.infura.io/v3/YOUR_API_KEY--private-keyPrivate key for transaction signingYes0xabcd...1234--artifacts-locatorLocation of contract artifactsYesfile:///path/to/artifacts--configPath to JSON configuration fileYesvalidator-config.json--outfileFile to write output JSONNovalidator-output.json--cache-dirDirectory to cache artifactsNo.artifacts-cache
```

### Configuration File Format

The configuration file should be a JSON file with the following structure:

```json
json
[ ]

{
  "release": "v1.8.0-rc.4",
  "superchainConfig": "0x123...abc",
  "l1PAOMultisig": "0x234...bcd",
  "challenger": "0x345...cde",
  "superchainConfigImpl": "0x456...def",
  "protocolVersionsImpl": "0x567...efg",
  "l1ERC721BridgeImpl": "0x678...fgh",
  "optimismPortalImpl": "0x789...ghi",
  "ethLockboxImpl": "0x89a...hij",
  "systemConfigImpl": "0x9ab...ijk",
  "optimismMintableERC20FactoryImpl": "0xabc...jkl",
  "l1CrossDomainMessengerImpl": "0xbcd...klm",
  "l1StandardBridgeImpl": "0xcde...lmn",
  "disputeGameFactoryImpl": "0xdef...mno",
  "anchorStateRegistryImpl": "0xefg...nop",
  "delayedWETHImpl": "0xfgh...opq",
  "mipsImpl": "0xghi...pqr",
  "withdrawalDelaySeconds": 604800
}

```

Most of these addresses should come from the output of the previous bootstrap commands, particularly the `bootstrap implementations` command.

### Example

```bash
bash
[ ]

op-deployer bootstrap validator \
  --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
  --private-key 0xYOUR_PRIVATE_KEY \
  --artifacts-locator file:///path/to/artifacts \
  --config validator-config.json \
  --outfile validator-output.json

```

### Output

The command outputs a JSON file containing the deployed validator contract address:

```json
json
[ ]

{
  "validator": "0x123...abc"
}

```

## Working with Artifacts

The `artifacts-locator` parameter specifies where the contract deployment artifacts are located. There are several ways to provide artifacts:

### Using Local Files

To use local artifacts (recommended for production or if you're experiencing issues with remote artifacts):

1. Clone the contracts repository:
    
    ```bash
    bash
    [ ]
    
    git clone https://github.com/ethereum-optimism/optimism.git
    cd optimism
    git checkout v1.8.0-rc.4# Use the desired version
    
    ```
    
2. Build the artifacts:
    
    ```bash
    bash
    [ ]
    
    cd packages/contracts-bedrock
    pnpm install
    pnpm build
    
    ```
    
3. Use the local path in your command:
    
    ```bash
    bash
    [ ]
    
    --artifacts-locator file:///absolute/path/to/optimism/packages/contracts-bedrock/artifacts
    
    ```
    

### Using Tagged Artifacts

For development or testing, you can try using tagged artifacts (but note there are known issues with this approach):

```bash
bash
[ ]

--artifacts-locator tag://op-contracts/v1.8.0-rc.4

```

If you encounter the error `Application failed: failed to parse artifacts URL: unsupported tag`, you'll need to use the local files method described above.

## Complete Bootstrap Workflow Example

Here's a step-by-step workflow to bootstrap a complete superchain from scratch:

1. **Deploy Proxy Admin**:
    
    ```bash
    bash
    [ ]
    
    op-deployer bootstrap proxy \
      --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
      --private-key 0xYOUR_PRIVATE_KEY \
      --artifacts-locator file:///path/to/artifacts \
      --proxy-owner 0xYOUR_OWNER_ADDRESS \
      --outfile proxy-output.json
    
    ```
    
2. **Store the proxy admin address** for use in the next steps:
    
    ```bash
    bash
    [ ]
    
    PROXY_ADMIN=$(jq -r '.ProxyAdmin' proxy-output.json)
    echo "Proxy Admin: $PROXY_ADMIN"
    
    ```
    
3. **Deploy Superchain Configuration**:
    
    ```bash
    bash
    [ ]
    
    op-deployer bootstrap superchain \
      --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
      --private-key 0xYOUR_PRIVATE_KEY \
      --artifacts-locator file:///path/to/artifacts \
      --superchain-proxy-admin-owner 0xADMIN_OWNER_ADDRESS \
      --protocol-versions-owner 0xVERSIONS_OWNER_ADDRESS \
      --guardian 0xGUARDIAN_ADDRESS \
      --paused false \
      --required-protocol-version 1.0.0 \
      --recommended-protocol-version 1.0.0 \
      --outfile superchain-output.json
    
    ```
    
4. **Store the superchain configuration addresses**:
    
    ```bash
    bash
    [ ]
    
    SUPERCHAIN_CONFIG=$(jq -r '.SuperchainConfig' superchain-output.json)
    PROTOCOL_VERSIONS=$(jq -r '.ProtocolVersions' superchain-output.json)
    echo "Superchain Config: $SUPERCHAIN_CONFIG"
    echo "Protocol Versions: $PROTOCOL_VERSIONS"
    
    ```
    
5. **Deploy Implementations**:
    
    ```bash
    bash
    [ ]
    
    op-deployer bootstrap implementations \
      --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
      --private-key 0xYOUR_PRIVATE_KEY \
      --artifacts-locator file:///path/to/artifacts \
      --l1-contracts-release v1.8.0-rc.4 \
      --mips-version 2 \
      --withdrawal-delay-seconds 604800 \
      --min-proposal-size-bytes 1 \
      --challenge-period-seconds 604800 \
      --proof-maturity-delay-seconds 60 \
      --dispute-game-finality-delay-seconds 604800 \
      --superchain-config-proxy $SUPERCHAIN_CONFIG \
      --protocol-versions-proxy $PROTOCOL_VERSIONS \
      --upgrade-controller 0x0000000000000000000000000000000000000000 \
      --outfile implementations-output.json
    
    ```
    
6. **Extract implementation addresses** for the validator configuration:
    
    ```bash
    bash
    [ ]
    
    # Example of extracting implementation addresses
    L1_CROSS_DOMAIN_MESSENGER_IMPL=$(jq -r '.L1CrossDomainMessenger' implementations-output.json)
    L1_ERC721_BRIDGE_IMPL=$(jq -r '.L1ERC721Bridge' implementations-output.json)
    # ... extract other implementation addresses similarly
    
    ```
    
7. **Create a validator configuration file**:
    
    ```bash
    bash
    [ ]
    
    cat > validator-config.json << EOF
    {
      "release": "v1.8.0-rc.4",
      "superchainConfig": "$SUPERCHAIN_CONFIG",
      "l1PAOMultisig": "0xYOUR_PAO_MULTISIG_ADDRESS",
      "challenger": "0xYOUR_CHALLENGER_ADDRESS",
      "superchainConfigImpl": "$SUPERCHAIN_CONFIG_IMPL",
      "protocolVersionsImpl": "$PROTOCOL_VERSIONS_IMPL",
      "l1ERC721BridgeImpl": "$L1_ERC721_BRIDGE_IMPL",
      "optimismPortalImpl": "$OPTIMISM_PORTAL_IMPL",
      "ethLockboxImpl": "$ETH_LOCKBOX_IMPL",
      "systemConfigImpl": "$SYSTEM_CONFIG_IMPL",
      "optimismMintableERC20FactoryImpl": "$OPTIMISM_MINTABLE_ERC20_FACTORY_IMPL",
      "l1CrossDomainMessengerImpl": "$L1_CROSS_DOMAIN_MESSENGER_IMPL",
      "l1StandardBridgeImpl": "$L1_STANDARD_BRIDGE_IMPL",
      "disputeGameFactoryImpl": "$DISPUTE_GAME_FACTORY_IMPL",
      "anchorStateRegistryImpl": "$ANCHOR_STATE_REGISTRY_IMPL",
      "delayedWETHImpl": "$DELAYED_WETH_IMPL",
      "mipsImpl": "$MIPS_IMPL",
      "withdrawalDelaySeconds": 604800
    }
    EOF
    
    ```
    
8. **Deploy Validator**:
    
    ```bash
    bash
    [ ]
    
    op-deployer bootstrap validator \
      --l1-rpc-url https://sepolia.infura.io/v3/YOUR_API_KEY \
      --private-key 0xYOUR_PRIVATE_KEY \
      --artifacts-locator file:///path/to/artifacts \
      --config validator-config.json \
      --outfile validator-output.json
    
    ```
    
9. Once all these commands have successfully completed, you'll have bootstrapped the core components needed for a new superchain. You can now proceed to deploy individual chains using the standard `op-deployer apply` command.

## Troubleshooting

### Issue: Unsupported Tag Error

If you encounter an error like `Application failed: failed to parse artifacts URL: unsupported tag` when using `tag://` format:

**Solution**: Use local artifacts as described in the "Working with Artifacts" section.

### Issue: MIPS Version Selection Error

If you encounter an error indicating that MIPS version must be 1 or 2:

**Solution**: Ensure you're specifying exactly `1` or `2` as the MIPS version value, not any other number.

### Issue: Transaction Gas Issues

If transactions fail due to gas limits or costs:

**Solution**: Ensure your deployer account has sufficient ETH (at least 1 ETH for bootstrapping operations), and consider using a network with lower gas costs for testing.