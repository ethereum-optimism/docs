# Content Reuse

Content reuse is when you reuse the same piece of content in various places. It means that technical writers don't have to re-write text many times, and it means that the original piece of copy should be easy to locate so that it can be used as often as needed. When changes are made to that original piece of text, it will then be automatically changed wherever else that piece of text is used, which saves a lot of time.

## Content Directory

The content directory contains markdown files that can be imported across the nextra website.

## How to Write Reusable Content

Create a `.md` file in the `/content` directory.

## How to Use Reusable Content

1. Import it at the top of `.mdx` file:

```
import DescriptionShort from '@/content/DescriptionShort.md' 
```

1. Use it within the file

```
Text before

<OpProposerDescriptionShort />

Text after
```