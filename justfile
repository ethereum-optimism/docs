# List available recipes
default:
    @just --list

# Lint
lint: spellcheck-lint
    pnpm eslint . --ext mdx --max-warnings 0

# Fix
fix: spellcheck-fix
    pnpm eslint . --ext mdx --fix

# Spellcheck lint
spellcheck-lint:
    pnpm cspell lint "**/*.mdx"

# Spellcheck fix
spellcheck-fix:
    pnpm cspell --words-only --unique "**/*.mdx" | sort --ignore-case | uniq > words.txt

# Link check
linkcheck:
    pnpm lychee --config ./lychee.toml --quiet "./pages"

# Index docs
index-docs:
    pnpm ts-node --skip-project utils/algolia-indexer.ts

# Dev server
dev:
    pnpm next dev

# Build
build:
    pnpm next build

# Start
start:
    pnpm next start

# Post-build (sitemap generation)
sitemap:
    pnpm next-sitemap

# Full build process
full-build: build sitemap

# Install dependencies
install:
    pnpm install

# Run all checks
check: lint linkcheck