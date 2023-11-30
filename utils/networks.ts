import * as addresses from 'superchain-registry/superchain/extra/addresses/addresses.json'

interface Network {
  mainnet: {
    l1: Chain
    l2: Chain
  }
  testnet: {
    l1: Chain
    l2: Chain
  }
}

class Chain {
  public name: string
  public id: number
  public explorer: string
  public connect: string

  constructor(opts: {
    name: string
    id: number
    explorer: string
    connect: string
  }) {
    this.name = opts.name
    this.id = opts.id
    this.explorer = opts.explorer
    this.connect = opts.connect
  }

  public address(name: string) {
    return Object.entries(addresses)
      .find(([chainid, ]) => {
        return parseInt(chainid, 10) === this.id
      })[1][name]
  }
}

export const chains: {
  [name: string]: Chain
} = {
  ethereum: new Chain({
    name: 'Ethereum',
    id: 1,
    explorer: 'https://etherscan.io',
    connect: 'https://chainid.link?network=ethereum',
  }),
  opmainnet: new Chain({
    name: 'OP Mainnet',
    id: 10,
    explorer: 'https://optimistic.etherscan.io',
    connect: 'https://chainid.link?network=op-mainnet',
  }),
  sepolia: new Chain({
    name: 'Sepolia',
    id: 11155111,
    explorer: 'https://sepolia.etherscan.io',
    connect: 'https://chainid.link?network=sepolia',
  }),
  opsepolia: new Chain({
    name: 'OP Sepolia',
    id: 11155420,
    explorer: 'https://sepolia-optimistic.etherscan.io/',
    connect: 'https://chainid.link?network=op-sepolia',
  }),
}

export const networks: {
  [name: string]: Network
} = {
  op: {
    mainnet: {
      l1: chains.ethereum,
      l2: chains.opmainnet,
    },
    testnet: {
      l1: chains.sepolia,
      l2: chains.opsepolia,
    },
  }
}

export const network = networks[process.env.DOCS_NETWORK_NAME || 'op']
