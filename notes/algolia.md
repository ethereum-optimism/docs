# How the Optimism Docs Use Algolia

## Index

The index is managed by Algolia as part of their DocSearch program: 
(https://docsearch.algolia.com/). Algolia handles all of the legwork of scraping
the documentation and updating the index for free because the documentation is 
open and publicly available. 

## React Component

The custom React component is provided by Algolia's DocSearch React library
(https://docsearch.algolia.com/docs/api), and gets loaded directly via 
@/theme.config.tsx. The credentials need to be exposed to the public because 
they're consumed by the front-end component, which shouldn't be a concern
because the docs and search are open to the public. 