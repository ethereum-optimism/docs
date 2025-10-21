#!/bin/bash
set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Change to dispute-mon directory
cd "$SCRIPT_DIR/.."

# Load environment variables
source .env

# Path to op-dispute-mon binary
DISPUTE_MON_BIN="$PROJECT_ROOT/optimism/op-dispute-mon/bin/op-dispute-mon"

# Check if binary exists
if [ ! -f "$DISPUTE_MON_BIN" ]; then
    echo "Error: op-dispute-mon binary not found at $DISPUTE_MON_BIN"
    echo "Please build op-dispute-mon first:"
    echo "  cd $PROJECT_ROOT/optimism/op-dispute-mon"
    echo "  make op-dispute-mon"
    exit 1
fi

echo "Starting op-dispute-mon..."
echo "Game Factory: $GAME_FACTORY_ADDRESS"
echo "Proposer: $PROPOSER_ADDRESS"
echo "Challenger: $CHALLENGER_ADDRESS"

$DISPUTE_MON_BIN \
  --l1-eth-rpc=$L1_RPC_URL \
  --rollup-rpc=$ROLLUP_RPC \
  --game-factory-address=$GAME_FACTORY_ADDRESS \
  --honest-actors=$PROPOSER_ADDRESS,$CHALLENGER_ADDRESS \
  --network=$NETWORK \
  --monitor-interval=$MONITOR_INTERVAL \
  --log.level=$LOG_LEVEL \
  --log.format=$LOG_FORMAT \
  --metrics.enabled=$METRICS_ENABLED \
  --metrics.addr=$METRICS_ADDR \
  --metrics.port=$METRICS_PORT