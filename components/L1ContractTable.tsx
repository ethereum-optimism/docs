import type { ReactElement } from 'react'
import * as addresses from 'superchain-registry/superchain/extra/addresses/addresses.json'
import { AddressTable } from '@/components/AddressTable'

export function L1ContractTable({
  chain,
  explorer,
  legacy
}: {
  chain: string,
  explorer: string,
  legacy: boolean
}): ReactElement {
  return (
    <AddressTable
      chain={chain}
      explorer={explorer}
      legacy={legacy}
      addresses={
        Object.entries(addresses)
          .find(([chainid, ]) => {
            return chainid === chain
          })[1]
      }
    />
  )
}
