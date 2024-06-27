import type { ReactElement } from 'react'
import { AddressTable } from '@/components/AddressTable'
import { PREDEPLOYS } from '@/utils/constants'

export function L2ContractTable({
  chain,
  legacy
}: {
  chain: string,
  legacy: boolean
}): ReactElement {
  return (
    <AddressTable
      chain={chain}
      explorer={chain}
      legacy={legacy}
      addresses={PREDEPLOYS}
    />
  )
}
