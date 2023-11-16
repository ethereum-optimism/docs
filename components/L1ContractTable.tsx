import type { ReactElement } from 'react'
import * as addresses from 'superchain-registry/superchain/extra/addresses/addresses.json'
import { AddressTable } from '@/components/AddressTable'

export function L1ContractTable({
  chain,
  explorer
}: {
  chain: string,
  explorer: string,
}): ReactElement {
  return (
    <AddressTable
      chain={chain}
      explorer={explorer}
      addresses={
        Object.entries(addresses)
          .find(([chainid, ]) => {
            return chainid === chain
          })[1]
      }
    />
  )
}
