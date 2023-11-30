import nextra from 'nextra'
import remarkCodeImport from 'remark-code-import'
import remarkNetworkTemplate from './utils/plugins/remark/remark-network-template.mjs'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  defaultShowCopyCode: true,
  mdxOptions: {
    remarkPlugins: [
      remarkCodeImport,
      remarkNetworkTemplate,
    ]
  }
})

export default {
  ...withNextra(),
  eslint: {
    ignoreDuringBuilds: true,
  },
}
