import React, { useState, useEffect } from 'react'
import { CHAIN_CONSTANTS } from '../utils/constants'

interface Contract {
  name: string
  address: string
  description?: string
}

interface L2ContractTableProps {
  chain: string
  legacy?: boolean
}

export default function L2ContractTable({ chain, legacy = false }: L2ContractTableProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // For L2 contracts, we'll use the predefined constants since they're standard across OP Stack chains
        const { PREDEPLOYS, LEGACY_CONTRACT_NAMES } = await import('../utils/constants')
        
        let contractList: Contract[] = []
        
        if (legacy) {
          // For legacy contracts, only include legacy contract names
          contractList = LEGACY_CONTRACT_NAMES
            .filter(name => PREDEPLOYS[name as keyof typeof PREDEPLOYS])
            .map(name => ({
              name,
              address: PREDEPLOYS[name as keyof typeof PREDEPLOYS],
            }))
        } else {
          // For non-legacy contracts, exclude legacy contract names
          contractList = Object.entries(PREDEPLOYS)
            .filter(([name]) => !LEGACY_CONTRACT_NAMES.includes(name))
            .map(([name, address]) => ({
              name,
              address,
            }))
        }
        
        setContracts(contractList)
      } catch (err) {
        console.error('Error fetching L2 contracts:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch contracts')
      } finally {
        setLoading(false)
      }
    }

    fetchContracts()
  }, [chain, legacy])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (contracts.length === 0) {
    return <div>No contracts found</div>
  }

  // Determine the explorer URL based on the chain
  const explorerUrl = CHAIN_CONSTANTS[parseInt(chain)]?.explorer || 'https://explorer.optimism.io'

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
