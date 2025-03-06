# Redirect links management guide

## Scripts overview
Two scripts help maintain internal links when pages are redirected:

*   `check-redirects`: Identifies links that point to old URLs that have redirects defined in the `_redirects` file.
*   `fix-redirects`: Automatically updates links to use the new destination URLs defined in the `_redirects` file.

## Checking for outdated links

Run the check script:

```bash
pnpm lint  # OR
pnpm check-redirects 
```

## What `check-redirects` does

*   Scans all `.mdx` files in the docs
*   Reads your existing `_redirects` file (which contains mappings of old URLs to new URLs)
*   Identifies internal links that match the "from" paths in your redirects file
*   Reports links that should be updated to use the new destination URLs instead of relying on redirects
*   Provides a summary of total pages, pages with outdated links, and valid pages

The script does NOT check for broken links (404s) or suggest new redirects to add. It's specifically for maintaining internal link consistency by ensuring you're not using outdated URLs that require redirects.

## Example output

```bash
File "builders/overview.mdx" contains outdated link "/chain/overview" - should be updated to "/stack/overview"

Summary:
Total pages 🔍 - 50 
Pages with outdated links 🚫 - 2
Pages OK ✅ - 48
```

## Fixing outdated links

Fix links automatically:

```bash
pnpm fix  # OR
pnpm fix-redirects 
```

## What `fix-redirects` does

*   Reads your existing `_redirects` file (which contains mappings of old URLs to new URLs)
*   Scans all `.mdx` files looking for internal links
*   Automatically updates links that match "from" paths to use their corresponding "to" paths
*   Handles both Markdown links `[text](/path)` and HTML links `href="/path"`
*   Saves the modified files with the updated links
*   Reports which files were changed and which links were updated
*   Provides a summary showing how many files were fixed versus unchanged

This script is an automated fix tool that saves you from having to manually update all the outdated links that `check-redirects` would report.

## Example output

```bash
Fixed in "builders/overview.mdx": "/chain/overview" → "/stack/overview"

Summary:
Total pages checked 🔍 - 50
Pages fixed ✅ - 2  
Pages unchanged ⏩ - 48
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
*   No outdated links found: Verify `_redirects` entries are correct or all links might already be updated.
*   Links still broken after fixing: The script only updates links based on the `_redirects` file; it doesn't check if the destination URLs actually exist.