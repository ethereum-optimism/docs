# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview
This is the Optimism Documentation website repository that powers docs.optimism.io - the official technical documentation for the Optimism Collective, covering the OP Stack, Superchain, and interoperability features.

## Tech Stack
- **Framework**: Next.js 14.2.21 with React 18.2.0
- **Documentation Engine**: Nextra 2.13.2 (docs theme)
- **Language**: TypeScript
- **Package Manager**: pnpm (required - do not use npm or yarn)
- **Content Format**: MDX (Markdown with React components)
- **Deployment**: Netlify

## Essential Commands

### Development
```bash
pnpm dev          # Start development server at localhost:3001
pnpm build        # Create production build
```

### Quality Checks (Run before committing)
```bash
pnpm lint         # Run all linting (ESLint + spellcheck + breadcrumbs + redirects + metadata)
pnpm fix          # Auto-fix all fixable issues (runs on pre-push automatically)
```

### Individual Linting Commands
```bash
pnpm spellcheck:lint     # Check spelling
pnpm spellcheck:fix      # Add words to dictionary (words.txt)
pnpm lint:eslint         # Run ESLint
pnpm lint:breadcrumbs    # Validate breadcrumb structure
pnpm lint:redirects      # Check redirect configuration
pnpm lint:metadata       # Validate page metadata
```

## Architecture & Structure

### Content Organization
```
pages/                    # All documentation content (MDX files)
├── app-developers/      # Application developer guides
├── operators/           # Node & chain operator documentation
├── stack/              # OP Stack protocol documentation
├── superchain/         # Superchain network documentation
├── interop/           # Interoperability documentation
└── connect/           # Contributing guides and resources
```

### Key Directories
- `components/`: Reusable React components for documentation
- `public/`: Static assets, images, and tutorial files
- `utils/`: Utility scripts for linting, validation, and build processes
- `providers/`: React context providers for global state

## Important Patterns

### MDX Page Structure
All documentation pages use MDX format with frontmatter metadata:
```mdx
---
title: Page Title
lang: en-US
description: Page description for SEO
---

import { ComponentName } from '@/components/ComponentName'

# Content here...
```

### Component Imports
Use the configured path alias for component imports:
```typescript
import { ComponentName } from '@/components/ComponentName'
```

### Adding New Documentation
1. Create MDX file in appropriate `pages/` subdirectory
2. Include required frontmatter (title, lang, description)
3. Run `pnpm lint` to validate metadata and content
4. Use existing components from `components/` directory when possible

### Spell Checking
- Custom dictionary maintained in `words.txt`
- Add technical terms using `pnpm spellcheck:fix`
- Spell checking runs automatically in the lint pipeline

## Git Workflow
- **Pre-push hook**: Automatically runs `pnpm fix` via Husky
- **Auto-commit**: Fixes are automatically committed if changes are made
- **No pre-commit hooks**: Only validation on push

## Special Features
- **Kapa.ai Widget**: AI assistant integrated for documentation queries
- **Algolia Search**: Full-text search across documentation
- **Feelback**: User feedback collection system
- **Growth Book**: A/B testing framework for feature experiments

## Common Tasks

### Adding a New Page
1. Create `.mdx` file in appropriate `pages/` directory
2. Add frontmatter with title, lang, and description
3. Write content using Markdown and import React components as needed
4. Run `pnpm dev` to preview
5. Run `pnpm lint` before committing

### Updating Components
- Components are in `components/` directory
- Follow existing patterns and TypeScript types
- Test component changes across multiple pages that use them

### Working with Images
- Place images in `public/img/` directory
- Reference using `/img/filename.ext` in MDX files
- Optimize images before adding to repository

## Notes
- The repository uses automated quality checks - always run `pnpm lint` before pushing
- Netlify handles deployment automatically on merge to main
- TypeScript is configured with relaxed strict mode - follow existing patterns
- MDX allows mixing Markdown with React components - leverage this for interactive content