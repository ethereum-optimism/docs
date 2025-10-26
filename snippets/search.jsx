export const SearchBox = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchBoxStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '400px'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none'
  };

  const resultsStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderTop: 'none',
    borderRadius: '0 0 8px 8px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000
  };

  const resultItemStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee'
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      setLoading(true);
      setIsOpen(true);
      
      // Simulate search - in real implementation, this would call an API
      setTimeout(() => {
        const mockResults = [
          { id: 1, title: `Search result for "${value}"`, url: '/example-1' },
          { id: 2, title: `Another result for "${value}"`, url: '/example-2' },
          { id: 3, title: `More results about "${value}"`, url: '/example-3' },
        ];
        setResults(mockResults);
        setLoading(false);
      }, 500);
    } else {
      setIsOpen(false);
      setResults([]);
    }
  };

  const handleResultClick = (result) => {
    if (onSearch) {
      onSearch(result);
    }
    setQuery("");
    setIsOpen(false);
    setResults([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div style={searchBoxStyle}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={inputStyle}
      />
      
      {isOpen && (
        <div style={resultsStyle}>
          {loading ? (
            <div style={resultItemStyle}>Loading...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div
                key={result.id}
                style={resultItemStyle}
                onClick={() => handleResultClick(result)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'white';
                }}
              >
                {result.title}
              </div>
            ))
          ) : (
            <div style={resultItemStyle}>No results found</div>
          )}
        </div>
      )}
    </div>
  );
};
