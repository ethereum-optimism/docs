export const TokenListTable = ({ l1, l2 }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const explorers = {
    '1': 'https://etherscan.io',
    '5': 'https://goerli.etherscan.io',
    '10': 'https://explorer.optimism.io',
    '420': 'https://goerli-optimism.etherscan.io',
    '11155111': 'https://sepolia.etherscan.io/',
    '11155420': 'https://testnet-explorer.optimism.io/',
  };

  useEffect(() => {
    async function fetchTokenList() {
      try {
        // Fetch from the Optimism token list
        const response = await fetch('https://static.optimism.io/optimism.tokenlist.json');
        if (!response.ok) {
          throw new Error('Failed to fetch token list');
        }
        
        const tokenlist = await response.json();
        
        // Process tokens similar to the original logic
        const processedTokens = tokenlist.tokens
          .filter((token) => token.chainId === parseInt(l1))
          .sort((a, b) => a.symbol.localeCompare(b.symbol))
          .reduce((acc, token) => {
            // Remove duplicate L1 tokens by address
            if (acc.some((other) => other.address === token.address)) {
              return acc;
            } else {
              return acc.concat(token);
            }
          }, [])
          .map((token) => {
            // Find the corresponding L2 token
            const pair = tokenlist.tokens.find((other) => {
              return (
                other.chainId === parseInt(l2) &&
                other.symbol === token.symbol
              );
            });
            return { token, pair };
          })
          .filter(({ pair }) => pair !== undefined);
        
        setTokens(processedTokens);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching token list:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTokenList();
  }, [l1, l2]);

  if (loading) {
    return <div>Loading token list...</div>;
  }

  if (error) {
    return <div>Error loading token list: {error}</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Symbol</th>
          <th>L1 Token</th>
          <th>L2 Token</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map(({ token, pair }) => (
          <tr key={`${l1}.${l2}.${token.address}`}>
            <td>{token.name}</td>
            <td>{token.symbol}</td>
            <td>
              <a 
                href={`${explorers[l1]}/address/${token.address}`} 
                target="_blank" 
                rel="noreferrer"
              >
                <code>{token.address}</code>
              </a>
            </td>
            <td>
              <a 
                href={`${explorers[l2]}/address/${pair.address}`} 
                target="_blank" 
                rel="noreferrer"
              >
                <code>{pair.address}</code>
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
