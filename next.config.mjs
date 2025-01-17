import nextra from 'nextra'
import remarkCodeImport from 'remark-code-import'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  mdxOptions: {
    remarkPlugins: [
      remarkCodeImport,
    ]
  },
})

export default {
  ...withNextra(),
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Don't put redirects here
  // they go in public/_redirects
}
