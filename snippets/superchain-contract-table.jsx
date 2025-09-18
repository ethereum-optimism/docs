import { AddressTable } from "/snippets/address-table.jsx"

function getConfigUrl(chain) {
  const isTestnet = chain === '11155111';
  const network = isTestnet ? 'sepolia' : 'mainnet';
  return `https://raw.githubusercontent.com/ethereum-optimism/superchain-registry/main/superchain/configs/${network}/superchain.toml`;
}

function parseSimpleToml(tomlText) {
  const result = {};
  const lines = tomlText.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, value] = trimmed.split('=', 2);
      const cleanKey = key.trim();
      const cleanValue = value.trim().replace(/['"]/g, '');
      
      if (/^0x[a-fA-F0-9]{40}$/.test(cleanValue)) {
        result[cleanKey] = cleanValue;
      }
    }
  }
  
  return result;
}

function extractAddresses(obj) {
  const addresses = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)) {
      let newKey = key;
      if (key === 'protocol_versions_addr') newKey = 'ProtocolVersions';
      if (key === 'superchain_config_addr') newKey = 'SuperchainConfig';
      if (key === 'op_contracts_manager_proxy_addr') newKey = 'OPContractsManagerProxy';
      addresses[newKey] = value;
    }
  }
  return addresses;
}

export const SuperchainContractTable = ({ chain, explorer }) => {
  const [config, setConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function fetchAddresses() {
      try {
        const configUrl = getConfigUrl(chain);
        const response = await fetch(configUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch config from ${configUrl}`);
        }
        const text = await response.text();
        
        const data = parseSimpleToml(text);
        setConfig(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching or parsing config:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAddresses();
  }, [chain]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
