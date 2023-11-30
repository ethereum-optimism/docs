import { visit } from 'unist-util-visit'
export default function remarkNetworkTemplate() {
  return (tree) => {
    visit(tree, 'text', (node) => {
      if (typeof node.value === 'string') {
        node.value = node.value.replace(/%NETWORK_MAINNET_L2_NAME%/g, 'OP Mainnet');
      }
    });
  };
};