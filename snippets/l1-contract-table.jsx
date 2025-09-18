import { AddressTable } from "/snippets/address-table.jsx"

export const L1ContractTable = ({ chain, explorer, legacy }) => {
  const [addresses, setAddresses] = React.useState({})
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    async function fetchAddresses() {
      try {
        const response = await fetch('https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/main/superchain/extra/addresses/addresses.json')
        
        if (!response.ok) {
          throw new Error('Failed to fetch addresses')
        }
        
        const data = await response.json()
        const chainData = data[chain] || {}
        
        setAddresses(chainData)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching addresses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [chain, legacy])

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
      addresses={addresses}
    />
  )
}
