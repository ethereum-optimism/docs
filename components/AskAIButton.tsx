import { RiSparkling2Fill } from '@remixicon/react';
import { useFeature } from '@growthbook/growthbook-react';

const AskAIButton = () => {
  const enableDocsAIWidget = useFeature('enable_docs_ai_widget').on;

  if (!enableDocsAIWidget) {
    return null;
  }

  return (
    <button id='custom-ask-ai-button' className='nx-flex nx-gap-2 nx-items-center nx-py-1.5 nx-px-3 nx-rounded-lg nx-text-sm nx-font-semibold' style={{ backgroundColor: '#FF0420', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span>Ask AI</span>
      <RiSparkling2Fill size={14} />
    </button>
  );
};

export { AskAIButton };
