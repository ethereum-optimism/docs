import { RiSparkling2Fill } from '@remixicon/react';
import { useFeature } from '@growthbook/growthbook-react';
import { useEffect, useState } from 'react';

interface AskAIButtonProps {
  fullWidth?: boolean;
  large?: boolean;
}

const AskAIButton = ({ fullWidth = false, large = false }: AskAIButtonProps) => {
  const [mounted, setMounted] = useState(false);
  const enableDocsAIWidget = useFeature('enable_docs_ai_widget').on;
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until client-side
  if (!mounted) {
    return null;
  }

  if (!enableDocsAIWidget) {
    return null;
  }

  const baseClasses = 'nx-flex nx-gap-2 nx-items-center nx-rounded-lg nx-font-semibold nx-justify-center';
  const sizeClasses = large 
    ? 'nx-py-3 nx-px-6 nx-text-base' 
    : 'nx-py-1.5 nx-px-3 nx-text-sm';
  const widthClasses = fullWidth ? 'nx-w-full' : '';
  const iconSize = large ? 16 : 14;

  return (
        <button 
        id='custom-ask-ai-button' 
        className={`${baseClasses} ${sizeClasses} ${widthClasses}`}
        style={{ 
          backgroundColor: '#FF0420', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px' 
        }}
      >
      <span>Ask AI</span>
      <RiSparkling2Fill size={iconSize} />
    </button>
  );
};

export { AskAIButton };
