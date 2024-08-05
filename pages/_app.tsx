import '../styles/global.css'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import * as gtag from '../utils/gtag'
import * as aa from "search-insights"

export default function App({ Component, pageProps }) {
  const router = useRouter()
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  aa.default('init', {
    appId: "JCF9BUJTB9",
    apiKey: "cc766a73d4b0004e3059677de49297a2"
  })

  return <Component {...pageProps} />
}
