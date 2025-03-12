import '../styles/global.css';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as gtag from '../utils/gtag';
import * as aa from 'search-insights';
import AlgoliaContext from '@/utils/contexts/AlgoliaContext';
import ScrollDispatcher from '@/components/ScrollDispatcher';
import { CustomGrowthBookProvider } from '../providers/GrowthbookProvider';

export default function App({ Component, pageProps }) {
  const [queryID, setQueryID] = useState(null);
  const [objectID, setObjectID] = useState(null);

  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Initialize Algolia insights with environment variables
  aa.default('init', {
    appId: process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID || '',
    apiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || ''
  });

  return (
    <CustomGrowthBookProvider>
      <AlgoliaContext.Provider
        value={{
          queryID,
          setQueryID,
          objectID,
          setObjectID
        }}
      >
        <ScrollDispatcher>
          <Component {...pageProps} />
        </ScrollDispatcher>
      </AlgoliaContext.Provider>
    </CustomGrowthBookProvider>
  );
}