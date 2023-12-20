import remarkLintNoBlockedCharacters from './utils/plugins/remark/remark-lint-no-blocked-characters.mjs'

export default {
  plugins: [
    remarkLintNoBlockedCharacters,
    "remark-gfm",
    "remark-frontmatter",
    "remark-preset-lint-consistent",
    "remark-preset-lint-recommended",
    "remark-lint-table-cell-padding",
    "remark-lint-table-pipe-alignment",
    "remark-lint-table-pipes",
    "@double-great/remark-lint-alt-text",
    [
      "remark-lint-heading-style",
      "atx"
    ],
    [
      "remark-lint-unordered-list-marker-style",
      "*"
    ],
    [
      "remark-lint-frontmatter-schema",
      {
        schemas: {
          "./utils/schemas/page.schema.yaml": [
            "./pages/**/*.mdx"
          ]
        }
      }
    ]
  ]
}
