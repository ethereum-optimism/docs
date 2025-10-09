#!/bin/bash

# Quick fix for remaining frontmatter issues
# This script is more targeted and safer

files_to_fix=(
    "./stack/public-devnets.mdx"
    "./stack/features/send-raw-transaction-conditional.mdx"
    "./stack/fault-proofs/mips.mdx"
    "./stack/differences.mdx"
    "./stack/components.mdx"
    "./app-developers/starter-kit.mdx"
    "./app-developers/transactions.mdx"
    "./connect/resources/glossary.mdx"
)

for file in "${files_to_fix[@]}"; do
    if [[ -f "$file" ]]; then
        echo "Processing: $file"
        
        # Use perl for more precise multiline replacement
        perl -i -pe '
        BEGIN { undef $/; }
        s/description: >-\n---\n\n(.*?)\n---/description: $1/gms;
        ' "$file"
        
        # Clean up extra whitespace in description
        sed -i '' 's/description: \s*/description: /' "$file"
        sed -i '' 's/description: \(.*\)\s\+$/description: \1/' "$file"
        
        echo "Fixed: $file"
    fi
done

echo "Batch processing complete!"
