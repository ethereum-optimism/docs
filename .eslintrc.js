module.exports = {
  parserOptions: {
    ecmaVersion: 'latest'
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
        'mdx/code-blocks': true
      },
      rules: {
        'no-unused-expressions': 'off'
      }
    }
  ]
}
