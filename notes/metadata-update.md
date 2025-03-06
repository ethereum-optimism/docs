# Metadata Management System

Quick guide on using our metadata management system for the OP Stack documentation.

## What the System Does

* Validates and updates metadata in .mdx documentation files
* Ensures consistent metadata across documentation
* Generates a manifest of processed files
* Supports dry run mode for previewing changes
* Automatically detects content categories and types

## Using the Scripts

1. Run a dry run to preview changes:
   ```bash
   # Process all .mdx files in a directory and its subdirectories
   pnpm metadata-batch-cli:dry "pages/superchain/**/*.mdx"

   # Process a specific file with verbose output
   pnpm metadata-batch-cli:verbose "pages/app-developers/example.mdx"

   # Process multiple directories
   pnpm metadata-batch-cli:dry "pages/app-developers/**/*.mdx" "pages/node-operators/**/*.mdx"
   ```

2. Apply the changes (remove :dry):
   ```bash
   pnpm metadata-batch-cli "pages/app-developers/**/*.mdx"
   ```

### Important Note About File Patterns

Use these patterns to match files:

* `directory/**/*.mdx` - matches all .mdx files in a directory and all its subdirectories
* `directory/*.mdx` - matches only .mdx files in the specific directory
* `directory/subdirectory/**/*.mdx` - matches all .mdx files in a specific subdirectory tree
* the quotes around the pattern are important to prevent shell expansion

### Configuration Files

1. **keywords.config.yaml**
   * Located in the project root
   * **Single source of truth** for all valid metadata values
   * Defines validation rules for metadata fields
   * Specifies required fields for different content types
   * Contains keyword mappings for category detection
   * Example configuration:
```yaml
metadata_rules:
  topic:
    required: true
    validation_rules:
      - pattern: "^[a-z0-9-]+$"
        description: "Must be lowercase with hyphens"
  personas:
    required: true
    multiple: true
    validation_rules:
      - enum:
        - app-developer
        - node-operator
        - chain-operator
        - protocol-developer
        - partner
  content_type:
    required: true
    validation_rules:
      - enum:
        - tutorial
        - guide
        - reference
        - landing-page
        - troubleshooting
        - notice
  categories:
    required: true
    multiple: true
    validation_rules:
      - enum:
        - protocol
        - security
        - governance
        - tokens
        - standard-bridge
        - interoperable-message-passing
        - devnet
        - infrastructure
```

2. **metadata-types.ts**
   * Defines TypeScript interfaces for metadata
   * Imports and validates valid values from keywords.config.yaml
   * Provides type-safe exports for use throughout the system
   * Used for type checking and validation

## What to Watch For

1. **Before Running**
   * Commit your current changes
   * Ensure you're in the docs root directory
   * Check that keywords.config.yaml exists and is properly configured
   * **Important**: All metadata values must be defined in keywords.config.yaml

2. **After Running**
   * Review the categories assigned to each file
   * Check that topics and personas are correct
   * Verify any files marked for review
   * Make sure network types (mainnet/testnet) are correct for registry files

## Content Analysis

The `metadata-analyzer.ts` script handles automatic content analysis and categorization.

### How It Works

1. **Category Detection**
   * Analyzes file content and paths for relevant keywords
   * Detects appropriate categories based on context
   * Handles special cases for chain operators and node operators
   * Supports parent category inheritance for landing pages

2. **Content Type Detection**
   * Identifies content type (guide, reference, tutorial, etc.)
   * Uses filename patterns and content signals
   * Considers component usage (e.g., <Cards>, <Steps>)
   * Scores content against multiple type indicators

### Valid Categories

Categories are defined in `keywords.config.yaml`. Check this file for the current list of valid categories. The metadata validation system uses these definitions to ensure consistency across all documentation.

Example of how categories are defined:
```yaml
metadata_rules:
  categories:
    required: true
    multiple: true
    validation_rules:
      - enum:
        - protocol
        - security
        - governance
        # ... see keywords.config.yaml for complete list
```

### Example Analysis

Input file with chain operator content:
```yaml
---
title: Genesis Creation
description: Learn how to create a genesis file.
---
```

Detected categories:
```yaml
categories:
  - protocol
  - devnet
  - governance
  - security
```

### Special Cases

* **Landing Pages**: Categories are determined by analyzing the child content they link to (typically via `<Cards>` components)
* **Chain Operators**: Additional category detection for specific features
* **Node Operators**: Special handling for node operation content
* **Imported Content**: Skip category review flags for imported content

## Implementation Files

* `utils/metadata-manager.ts`: Main metadata management system
* `utils/metadata-analyzer.ts`: Content analysis and categorization logic
* `utils/metadata-batch-cli.ts`: CLI tool for batch updates
* `utils/types/metadata-types.ts`: TypeScript type definitions
* `keywords.config.yaml`: Validation rules and keyword mappings

## Automated PR Checks

The documentation repository includes automated checks for metadata completeness:

1. **CircleCI Validation**
   * Automatically runs on all PRs
   * Checks metadata in modified .mdx files
   * Fails if required metadata is missing
   * Run locally with: `pnpm validate-pr-metadata`

2. **CodeRabbit Review**
   * Reviews frontmatter in modified files
   * Checks for required fields based on content type
   * Suggests running metadata-batch-cli when metadata is incomplete

### When to Run Metadata Updates

* When CircleCI metadata validation fails
* When CodeRabbit suggests missing metadata
* When adding new documentation files
* When specifically asked to update metadata

Do not run the script on files that already have correct metadata, as this may overwrite manual customizations.
