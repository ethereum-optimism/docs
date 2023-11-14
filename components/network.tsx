const networks = {
  op: {
    name: 'OP Mainnet',
    testnet: 'OP Goerli',
    explorer: 'https://optimistic.etherscan.io',
    testexplorer: 'https://goerli-optimistic.etherscan.io',
  }
}

export const Network = ({ k }) => {
  return <span>{networks.op[k]}</span>
}
