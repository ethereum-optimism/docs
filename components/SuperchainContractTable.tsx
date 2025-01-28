import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { AddressTable, TableAddresses } from '@/components/AddressTable';
import toml from 'toml';

const CONFIG_URL = 'https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/main/superchain/configs/mainnet/superchain.toml';

export function SuperchainContractTable({
  chain,
  explorer,
}: {
  chain: string;
  explorer: string;
}): ReactElement {
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const response = await fetch(CONFIG_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch config');
        }
        const text = await response.text();
        const data = toml.parse(text);
        setConfig(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching or parsing config:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAddresses();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

// Helper function to recursively extract Ethereum addresses with renamed keys
function extractAddresses(obj: Record<string, any>, prefix = ''): TableAddresses {
  const addresses: TableAddresses = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)) {
      // Rename specific keys
      let newKey = `${prefix}${key}`;
      if (key === 'protocol_versions_addr') newKey = 'ProtocolVersions';
      if (key === 'superchain_config_addr') newKey = 'SuperchainConfig';
      if (key === 'op_contracts_manager_proxy_addr') newKey = 'OPContractsManagerProxy';
      addresses[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(addresses, extractAddresses(value, `${key}.`)); // Recurse into nested objects
    }
  }
  return addresses;
}


  const addresses = extractAddresses(config || {});

  return (
    <AddressTable
      chain={chain}
      explorer={explorer}
      legacy={false}
      addresses={addresses}
    />
  );
}
