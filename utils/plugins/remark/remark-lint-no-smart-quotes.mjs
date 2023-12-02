import { visit } from 'unist-util-visit'
import { lintRule } from 'unified-lint-rule'

const remarkLintNoSmartQuotes = lintRule(
  {
    url: 'https://github.com/ethereum-optimism/docs',
    origin: 'remark-lint:no-smart-quotes'
  },
  (tree, file) => {
    visit(tree, 'text', (node) => {
      const smartQuotesRegex = /[“”‘’]/g
      const replacements = {
        '“': '"',
        '”': '"',
        '‘': "'",
        '’': "'"
      }

      let match
      while ((match = smartQuotesRegex.exec(node.value)) !== null) {
        file.message(
          `Smart quote found: ${match[0]} at index ${match.index}`,
          node
        )

        node.value = node.value.substring(0, match.index) + replacements[match[0]] + node.value.substring(match.index + 1)
        file.messages[file.messages.length - 1].fix = {
          range: [node.position.start.offset, node.position.end.offset],
          text: node.value
        }
      }
    })
  }
)

export default remarkLintNoSmartQuotes