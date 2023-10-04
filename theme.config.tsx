import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import { useConfig } from 'nextra-theme-docs'
import { FeelbackReaction, PRESET_FEELING } from "@feelback/react"
import "@feelback/react/styles/feelback.css"

//export function YourComponent() {
//  return (
//    <FeelbackReaction contentSetId="1190b071-9b78-4c62-8a2c-480f04df2562"
//      preset={PRESET_FEELING}
//      textQuestion="Did you find this page useful?"
//      textAnswer="Thanks for your feedback!"
//    />
//  );
//}

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
  //main: ({ children }) => {
  //  return (
 //       <>
 //           {children}
  //          <hr />
  //          <YourComponent />
  //      </>
  //  );
 //},
 toc: {
  extraContent: () =>
    <>
      <hr className="divider" />
      <FeelbackReaction contentSetId="1190b071-9b78-4c62-8a2c-480f04df2562"
      preset={PRESET_FEELING}
      textQuestion="Is this page useful?"
      textAnswer="Thanks for your feedback."
      />
    </>
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
