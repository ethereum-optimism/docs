import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import { useConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>OP Documentation</span>,
  darkMode: true,
  project: {
    link: 'https://github.com/ethereum-optimism/docs',
  },
  chat: {
    link: 'https://discord.optimism.io',
  },
  docsRepositoryBase: 'https://github.com/ethereum-optimism/docs',
  footer: {
    text: 'OP Documentation',
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  useNextSeoProps() {
    const { asPath } = useRouter()
    if (asPath !== '/') {
      return {
        titleTemplate: '%s | OP Docs'
      }
    }
  },
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter()
    const { frontMatter } = useConfig()
    const url =
      'https://docs.optimism.io' +
      (defaultLocale === locale ? asPath : `/${locale}${asPath}`)
 
    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:title" content={frontMatter.title || 'OP Docs'} />
        <meta
          property="og:description"
          content={frontMatter.description || 'Build With Optimism Labs'}
        />
      </>
    )
  },
  // https://nextra.site/docs/docs-theme/theme-configuration
  // primaryHue: {
  //   dark: 
  //   light: 
  // }
}

export default config
