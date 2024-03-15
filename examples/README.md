See stackblitz

# OP Stack viem example

An example of getting a withdrawal status with viem that runs in a stack blitz

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ethereum-optimism/docs/tree/01-03-feat_Add_404_page/examples?file=viem%2Fwithdrawal-status.mjs)

Note: this can be also embedded into a docs site via an iframe

```html
<iframe src="https://stackblitz.com/github/ethereum-optimism/docs/tree/01-03-feat_Add_404_page/examples?file=viem%2Fwithdrawal-status.mjs"></iframe>
```

## .stackblitzrc

This is how you configure stackblitz https://developer.stackblitz.com/platform/webcontainers/project-config#frontmatter-title

## index.html and main.mjs

I made a really simple basic html site that runs via [vitest](https://vitest.dev/). The html file imports the main.mjs file. It's not using a framework it's just basic html and javascript for simplicity.

All the site does is run the example code and output the result. This is useful within stackblitz because it gives you something to look at in the browser.

## viem/withdrawal-status.mjs

Simple example of getting withdrawal status with viem. For simplicity it just uses javascript which means you can run it with node without needing to build or use ts-node etc.

## viem/withdrawal-status.spec.mjs

Might be worth adding checks that make sure the example is working as expected
