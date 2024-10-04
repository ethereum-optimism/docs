import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { AddressTable, TableAddresses } from '@/components/AddressTable'

const CONFIG_URL = 'https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/main/superchain/configs/configs.json';

export function SuperchainContractTable({
  chain,
  explorer,
}: {
  chain: string,
  explorer: string,
}): ReactElement {
  const [config, setConfig] = useState<Record<string, any> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const response = await fetch(CONFIG_URL)
        if (!response.ok) {
          throw new Error('Failed to fetch config')
        }
        const data = await response.json()
        setConfig(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching config:', err)
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

  // Find the superchain config for the given chain.
  const superchain = config?.superchains.find(
    (sc: any) => sc.config.L1.ChainID.toString() === chain
  )

  // Create a TableAddresses object with the ProtocolVersions and SuperchainConfig addresses.
  const addresses: TableAddresses | undefined = superchain && {
    ProtocolVersions: superchain.config.ProtocolVersionsAddr,
    SuperchainConfig: superchain.config.SuperchainConfigAddr,
  };

  return (
    <AddressTable
      chain={chain}
      explorer={explorer}
      legacy={false}
      addresses={addresses}
    />
  )
}
