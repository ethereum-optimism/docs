import React, { useState, useEffect } from 'react'
import { CHAIN_CONSTANTS } from '../utils/constants'

interface Contract {
  name: string
  address: string
  description?: string
}

interface SuperchainContractTableProps {
  chain: string
  explorer: string
}

export default function SuperchainContractTable({ chain, explorer }: SuperchainContractTableProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch from superchain-registry
        const response = await fetch(`https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/main/packages/chain-${chain}/contracts.json`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch contracts: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Transform the data to match our interface
        const contractList: Contract[] = Object.entries(data).map(([name, address]) => ({
          name,
          address: address as string,
        }))
        
        setContracts(contractList)
      } catch (err) {
        console.error('Error fetching superchain contracts:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch contracts')
      } finally {
        setLoading(false)
      }
    }

    fetchContracts()
  }, [chain])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (contracts.length === 0) {
    return <div>No contracts found</div>
  }

  const explorerUrl = CHAIN_CONSTANTS[parseInt(explorer)]?.explorer || 'https://etherscan.io'

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contract Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contract Address
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {contracts.map((contract) => (
            <tr key={contract.name}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {contract.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <a
                  href={`${explorerUrl}/address/${contract.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  {contract.address}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
