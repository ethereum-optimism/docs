import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'
import { useRouter } from 'next/router'
import { useConfig } from 'nextra-theme-docs'
import { useState } from "react"
import { FeelbackTaggedMessage, FeelbackValueDefinition, Question, PRESET_YESNO_LIKE_DISLIKE } from "@feelback/react"
import "@feelback/react/styles/feelback.css"

const YES_TAGS: FeelbackValueDefinition[] = [ 
  { value: "accurate", title: "Accurate", description: "Accurately describes the product or feature.", },
  { value: "problem-solved", title: "Solved my problem", description: "Helped me resolve an issue.", },
  { value: "clear", title: "Easy to understand", description: "Easy to follow and comprehend.", },
  { value: "product-chosen", title: "Helped me decide to use the product", description: "Convinced me to adopt the product or feature.", },
  { value: "other-yes", title: "Another reason" },
];
const NO_TAGS: FeelbackValueDefinition[] = [ 
  { value: "inaccurate", title: "Inaccurate", description: "Doesn't accurately describe the product or feature.", },
  { value: "missing-info", title: "Couldn't find what I was looking for", description: "Missing important information.", },
  { value: "unclear", title: "Hard to understand", description: "Too complicated or unclear.", },
  { value: "bad-examples", title: "Code samples errors", description: "One or more code samples are incorrect.", },
  { value: "other-no", title: "Another reason" },
];

const FEEDBACK_CONTENT_SET_ID = "content-set-id-from-the-panel";

export function FeedbackComponent() {
  const [choice, setChoice] = useState();

  return (
      <div className="feelback-container">
          {!choice
              ? <Question text="Was this page helpful?"
                  items={PRESET_YESNO_LIKE_DISLIKE}
                  showLabels
                  onClick={setChoice}
              />
              : <FeelbackTaggedMessage contentSetId={FEEDBACK_CONTENT_SET_ID}
                  layout="radio-group"
                  tags={choice === "y" ? YES_TAGS : NO_TAGS}
                  title={choice === "y" ? "What did you like?" : "What went wrong?"}
                  placeholder="(optional) Please, further detail the feedback"
              />
          }
      </div>
  );
}

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
  feedback: { content: null },
main: ({ children }) => {
  return (
      <>
          {children}
          <hr />
          <FeedbackComponent />
      </>
  );
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
