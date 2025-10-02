# Create L2 Rollup - Code Example

This directory contains the complete working implementation that accompanies the [Create L2 Rollup tutorial](/operators/chain-operators/tutorials/create-l2-rollup). It provides automated deployment of an OP Stack L2 rollup testnet using official published Docker images.

## Overview

This implementation deploys a fully functional OP Stack L2 rollup testnet, including:

- **L1 Smart Contracts** deployed on Sepolia testnet (via op-deployer)
- **Execution Client** (op-geth) processing transactions
- **Consensus Client** (op-node) managing rollup consensus
- **Batcher** (op-batcher) publishing transaction data to L1
- **Proposer** (op-proposer) submitting state root proposals
- **Challenger** (op-challenger) monitoring for disputes

## Prerequisites

### Software Dependencies

| Dependency | Version | Install Command | Purpose |
|------------|---------|-----------------|---------|
| [Docker](https://docs.docker.com/get-docker/) | ^24 | Follow Docker installation guide | Container runtime for OP Stack services |
| [Docker Compose](https://docs.docker.com/compose/install/) | latest | Usually included with Docker Desktop | Multi-container orchestration |
| [jq](https://github.com/jqlang/jq) | latest | `brew install jq` (macOS) / `apt install jq` (Ubuntu) | JSON processing for deployment data |
| [git](https://git-scm.com/) | latest | Usually pre-installed | Cloning repositories for prestate generation |

### Recommended: Tool Management

For the best experience with correct tool versions, we recommend installing [mise](https://mise.jdx.dev/):

```bash
# Install mise (manages all tool versions automatically)
curl https://mise.jdx.dev/install.sh | bash

# Install all required tools with correct versions
cd docs/create-l2-rollup-example
mise install
```

**Why mise?** It automatically handles tool installation and version management, preventing compatibility issues.

### Network Access

- **Sepolia RPC URL**: Get from [Infura](https://infura.io), [Alchemy](https://alchemy.com), or another provider
- **Sepolia ETH**: At least 2-3 ETH for contract deployment and operations
- **Public IP**: For P2P networking (use `curl ifconfig.me` to find your public IP)

## Quick Start

1. **Navigate to this code directory**:
   ```bash
   cd docs/pages/operators/chain-operators/tutorials/create-l2-rollup/code
   ```

2. **Configure environment variables**:
   ```bash
   cp .example.env .env
   # Edit .env with your actual values (L1_RPC_URL, PRIVATE_KEY, L2_CHAIN_ID)
   ```

3. **Download op-deployer**:
   ```bash
   make init    # Download op-deployer
   ```

4. **Deploy and start everything**:
   ```bash
   make setup   # Deploy contracts and configure all services
   make up      # Start all services
   ```

5. **Verify deployment**:
   ```bash
   make status  # Check service health
   make test-l1 # Verify L1 connectivity
   make test-l2 # Verify L2 functionality

   # Or manually check:
   docker-compose ps
   docker-compose logs -f op-node
   ```

## Environment Configuration

Copy `.example.env` to `.env` and configure the following variables:

```bash
# L1 Configuration (Sepolia testnet)
# Option 1: Public endpoint (no API key required)
L1_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
L1_BEACON_URL="https://ethereum-sepolia-beacon-api.publicnode.com"

# Option 2: Private endpoint (requires API key)
# L1_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY"
# L1_BEACON_URL="https://ethereum-sepolia-beacon-api.publicnode.com"

# Private key for deployment and operations
# IMPORTANT: Never commit this to version control
PRIVATE_KEY="YOUR_PRIVATE_KEY_WITHOUT_0x_PREFIX"

# Optional: Public IP for P2P networking (defaults to 127.0.0.1 for local testing)
P2P_ADVERTISE_IP="127.0.0.1"

# Optional: Custom L2 Chain ID (default: 16584)
L2_CHAIN_ID="16584"
```

The `.env` file will be automatically loaded by Docker Compose.

## Manual Setup (Alternative)

For detailed manual setup instructions, see the [Create L2 Rollup tutorial](/operators/chain-operators/tutorials/create-l2-rollup). The tutorial provides step-by-step guidance for setting up each component individually if you prefer not to use the automated approach.

## Directory Structure

```
code/
├── .example.env           # Environment variables template
├── docker-compose.yml     # Service orchestration
├── Makefile              # Automation commands
├── scripts/
│   ├── setup-rollup.sh   # Automated deployment script
│   └── download-op-deployer.sh # op-deployer downloader
└── README.md             # This file
```

**Generated directories** (created during deployment):
```
deployer/                 # op-deployer configuration and outputs
├── .deployer/           # Deployment artifacts (genesis.json, rollup.json, etc.)
├── addresses/           # Generated wallet addresses
└── .env                 # Environment variables
batcher/                 # op-batcher configuration
├── .env                 # Batcher-specific environment variables
proposer/                # op-proposer configuration
├── .env                 # Proposer-specific environment variables
challenger/              # op-challenger configuration
├── .env                 # Challenger-specific environment variables
└── data/                # Challenger data directory
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| op-geth | 8545 | HTTP RPC endpoint |
| op-geth | 8546 | WebSocket RPC endpoint |
| op-geth | 8551 | Auth RPC for op-node |
| op-node | 8547 | op-node RPC endpoint |
| op-node | 9222 | P2P networking |

## Monitoring and Logs

```bash
# View all service logs
make logs

# View specific service logs
docker-compose logs -f op-node
docker-compose logs -f op-geth

# Check service health
make status

# Restart all services
make restart

# Restart a specific service
docker-compose restart op-batcher
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8545-8551 and 9222 are available
2. **Insufficient ETH**: Make sure your deployment wallet has enough Sepolia ETH
3. **Network timeouts**: Check your L1 RPC URL and network connectivity
4. **Docker issues**: Ensure Docker daemon is running and you have sufficient resources

### Reset Deployment

To reset and redeploy:

```bash
# Stop all services and clean up
make clean

# Re-run setup
make setup
make up
```

## Security Notes

- **Never commit private keys** to version control
- **Use hardware security modules (HSMs)** for production deployments
- **Monitor gas costs** on Sepolia testnet
- **Backup wallet addresses** and deployment artifacts

## About This Code

This code example accompanies the [Create L2 Rollup tutorial](/operators/chain-operators/tutorials/create-l2-rollup) in the Optimism documentation. It provides a complete, working implementation that demonstrates the concepts covered in the tutorial.

## Contributing

This code is part of the Optimism documentation. For issues or contributions:

- **Documentation issues**: Report on the main [Optimism repository](https://github.com/ethereum-optimism/optimism)
- **Code improvements**: Submit pull requests to the Optimism monorepo
- **Tutorial feedback**: Use the documentation feedback mechanisms

## License

This code is provided as-is for educational and testing purposes. See the Optimism monorepo for licensing information.
