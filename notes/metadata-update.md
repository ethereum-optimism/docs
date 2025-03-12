# Metadata Validation System

## Overview

This system validates metadata in MDX documentation files against rules defined in `keywords.config.yaml`.

## Key Features

- Validates required metadata fields
- Ensures only valid keywords are used
- Provides suggestions from keywords.config.yaml
- Handles duplicate/imported pages with `is_imported_content` flag
- No automatic fixes - content writers make manual updates

## Using the Validator

To check your changes before committing:
```bash
pnpm validate-metadata
```

This will validate any MDX files you've modified but haven't committed yet. Fix any validation errors before committing your changes.

Note: Additional validation will run automatically when you create a PR.

## Metadata Requirements

All valid metadata values are defined in `keywords.config.yaml`. This file is the single source of truth for:

- Required fields
- Valid personas
- Valid content types
- Valid categories

### Handling Duplicate Pages

For pages that are imported or duplicated across sections:
- Set `is_imported_content: 'true'` for duplicate/imported pages
- Set `is_imported_content: 'false'` for original pages
- This helps manage duplicate topics and enables proper filtering

## When Validation Fails

1. Review the validation errors
2. Check keywords.config.yaml for valid options
3. Update your MDX frontmatter manually
4. Run validation again to confirm fixes

## Example Valid Frontmatter

```yaml
---
title: Example Page
description: A clear description
topic: example-topic
personas:
  - app-developer
content_type: guide
categories:
  - protocol
  - infrastructure
is_imported_content: 'false'  # Required: 'true' for imported/duplicate pages
---
```

Remember: All valid options are in keywords.config.yaml