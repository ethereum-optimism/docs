import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { AddressTable, TableAddresses } from '@/components/AddressTable'

const ADDRESSES_URL = 'https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/main/superchain/extra/addresses/addresses.json';

export function L1ContractTable({
  chain,
  explorer,
  legacy
}: {
  chain: string,
  explorer: string,
  legacy: boolean
}): ReactElement {
  const [addresses, setAddresses] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const response = await fetch(ADDRESSES_URL)
        if (!response.ok) {
          throw new Error('Failed to fetch addresses')
        }
        const data = await response.json()
        setAddresses(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching addresses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <AddressTable
      chain={chain}
      explorer={explorer}
      legacy={legacy}
      addresses={
        addresses && Object.entries(addresses)
          .find(([chainid, ]) => {
            return chainid === chain
          })?.[1] as TableAddresses
      }
    />
  )
}
