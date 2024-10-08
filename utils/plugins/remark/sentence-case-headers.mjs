import { visit } from 'unist-util-visit';
import { lintRule } from 'unified-lint-rule';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const remarkLintSentenceCaseHeaders = lintRule(
  {
    url: 'https://github.com/ethereum-optimism/docs', // Update with your actual URL
    origin: 'remark-lint:sentence-case-headers'
  },
  (tree, file) => {
    console.log("Linting headers...");

    function sentenceCaseHeader(header) {
      const text = header.children.map(node => node.value).join('').trim();
      const words = text.split(' ');

      // Capitalize the first word, make all others lowercase
      const formatted = words.map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // First word capitalized
        }
        return word.toLowerCase(); // All other words lowercase
      }).join(' ');

      return formatted !== text ? formatted : null; // Return the formatted text if different
    }

    visit(tree, 'heading', (node) => {
      const headerText = node.children.map(child => child.value).join('');
      console.log(`Checking header: ${headerText}`);

      const fixedText = sentenceCaseHeader(node);
      if (fixedText) {
        file.message('Header should be in sentence case', node);
        node.children[0].value = fixedText; // Update the header text
        file.message('Header text has been updated to sentence case', node);
      }
    });
  }
);

export default remarkLintSentenceCaseHeaders;
