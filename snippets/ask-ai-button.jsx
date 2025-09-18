export const AskAIButton = () => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until client-side
  if (!mounted) {
    return null;
  }

  return (
    <button 
      id='custom-ask-ai-button' 
      style={{ 
        backgroundColor: '#FF0420', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer'
      }}
    >
      <span>Ask AI</span>
      <span style={{ fontSize: '14px' }}>✨</span>
    </button>
  );
};
