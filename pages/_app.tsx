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

  aa.default('init', {
    appId: 'JCF9BUJTB9',
    apiKey: 'cc766a73d4b0004e3059677de49297a2'
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
