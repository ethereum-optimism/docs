# Content Reuse

Content reuse is when you reuse the same piece of content in various places. It means that technical writers don't have to re-write text many times, and it means that the original piece of copy should be easy to locate so that it can be used as often as needed. When changes are made to that original piece of text, it will then be automatically changed wherever else that piece of text is used, which saves a lot of time.

## Content Directory

The content directory contains markdown files that can be imported across the nextra website.

## How to Write Reusable Content

Create a `.md` file in the `/content` directory.

### How to Use a Single Reusable Content Component

1. Import it at the top of `.mdx` file:

```
import DescriptionShort from '@/content/DescriptionShort.md' 
```

2. Use it within the file

```
Text before

<DescriptionShort />

Text after
```

### How to Use Multiple Reusable Content Components

1. You can create a `index.js` file in the `content` directories and export 
the components like this:

```
export { default as ComponentA } from './ComponentA.md'
export { default as ComponentB } from './ComponentB.md'
```

2. Import it at the top of `.mdx` file:

```
import {ComponentA, ComponentB} from '@/content/index.js' 
```
