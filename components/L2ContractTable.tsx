import type { ReactElement } from 'react'
import { AddressTable } from '@/components/AddressTable'
import { PREDEPLOYS } from '@/utils/constants'

export function L2ContractTable({
  chain
}: {
  chain: string
}): ReactElement {
  return (
    <AddressTable
      chain={chain}
      explorer={chain}
      addresses={PREDEPLOYS}
    />
  )
}
