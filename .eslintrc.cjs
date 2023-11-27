module.exports = {
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'plugin:mdx/recommended',
  ],
  rules: {
  },
  overrides: [
    {
      files: ['pages/**/*.mdx'],
      extends: [
        'plugin:mdx/recommended'
      ],
      settings: {
        'mdx/code-blocks': true,
      }
    }
  ]
}
