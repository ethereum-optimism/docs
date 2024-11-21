# Redirect links management guide

## Scripts overview
Two scripts help maintain internal links when pages are redirected:

*   `check-redirects`: Identifies links that need updating based on the `_redirects` file.
*   `fix-redirects`: Automatically updates links to match `_redirects` entries.

##  Checking for broken links

Run the check script:

```bash
pnpm lint //OR
pnpm check-redirects 
```
## What it does

*   Scans all `.mdx` files in the docs
*   Compares internal links against `_redirects` file
*   Reports any outdated links that need updating
*   Provides a summary of total, broken, and valid links

## Example output

```bash
File "builders/overview.mdx" contains outdated link "/chain/overview" - should be updated to "/stack/overview"

Summary:
Total pages 🔍 - 50 
Pages broken 🚫 - 2
Pages OK ✅ - 48

```

## Fixing broken links

Fix links automatically:

```bash
pnpm fix //OR
pnpm fix-redirects 
```

## What it does

*   Updates all internal links to match `_redirects` entries
*   Preserves other content and formatting
*   Shows which files and links were updated
*   Provides a summary of changes made

## Example output

```bash
Fixed in "builders/overview.mdx": /chain/overview → /stack/overview

Summary:
Total files 🔍 - 50
Files fixed ✅ - 2  
Files skipped ⏭️  - 48
```

## Best practices

1.  Before running

  *   Commit current changes
  *   Review `_redirects` file is up-to-date
  *   Run `check-redirects` first to preview changes


2.  After running

  *   Review git diff of updated files
  *   Test updated links locally
  *   Commit changes with descriptive message



## Common issues

*   Script fails: Ensure `_redirects` file exists in public folder, it should always be there!
*   No broken links found: Verify `_redirects` entries are correct.