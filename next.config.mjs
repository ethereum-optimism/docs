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
  redirects: async () => [
      {
        source: '/stack/interop/architecture',
        destination: '/stack/interop/explainer#interoperability-architecture',
        permanent: false,
      },
      {
        source: '/stack/interop/cross-chain-message',
        destination: '/stack/interop/explainer#how-messages-get-from-one-chain-to-the-other',
        permanent: false,
      },
      {
        source: '/stack/interop/supersim',
        destination: '/stack/interop/tools/supersim',
        permanent: false,
      },
      {
        source: '/stack/interop/devnet',
        destination: '/stack/interop/tools/devnet',
        permanent: false,
      },
  ],
}
