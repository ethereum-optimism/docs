#!/bin/bash

# Script to generate meta.json files for each subdirectory in /pages/
# Run this script from the /pages/ directory

# Function to extract title from MDX file frontmatter
extract_title() {
    local file="$1"
    # Extract title from frontmatter using awk
    awk '
    BEGIN { in_frontmatter = 0 }
    /^---$/ { 
        if (in_frontmatter == 0) {
            in_frontmatter = 1
        } else {
            exit
        }
        next
    }
    in_frontmatter && /^title:/ {
        # Extract everything after "title:" and remove leading/trailing whitespace and quotes
        gsub(/^title:[ \t]*/, "")
        gsub(/^["'"'"']|["'"'"']$/, "")
        gsub(/^[ \t]+|[ \t]+$/, "")
        print
        exit
    }
    ' "$file"
}

# Function to create meta.json for a directory
create_meta_json() {
    local dir="$1"
    local meta_file="$dir/meta.json"
    
    echo "Processing directory: $dir"
    
    # Start building the JSON object
    echo "{" > "$meta_file"
    
    local first_entry=true
    
    # Find all .mdx files in the current directory (not subdirectories)
    while IFS= read -r -d '' mdx_file; do
        # Get the filename without extension
        local basename=$(basename "$mdx_file" .mdx)
        
        # Extract title from the MDX file
        local title=$(extract_title "$mdx_file")
        
        # If no title found, skip this file
        if [[ -z "$title" ]]; then
            echo "  Warning: No title found in $mdx_file, skipping..."
            continue
        fi
        
        # Add comma if not the first entry
        if [[ "$first_entry" != true ]]; then
            echo "," >> "$meta_file"
        fi
        
        # Add the entry to meta.json
        printf ' "%s": "%s"' "$basename" "$title" >> "$meta_file"
        first_entry=false
        
        echo "  Added: $basename -> $title"
        
    done < <(find "$dir" -maxdepth 1 -name "*.mdx" -type f -print0 | sort -z)
    
    # Close the JSON object
    echo "" >> "$meta_file"
    echo "}" >> "$meta_file"
    
    # Only keep the meta.json file if it has actual content
    if [[ "$first_entry" == true ]]; then
        echo "  No MDX files found in $dir, removing empty meta.json"
        rm "$meta_file"
    else
        echo "  Created: $meta_file"
    fi
}

# Main script execution
echo "Starting meta.json generation..."
echo "Current directory: $(pwd)"

# Check if we're in the right place
if [[ ! -d "." ]]; then
    echo "Error: Current directory doesn't exist"
    exit 1
fi

# Find all directories (including current directory and subdirectories)
while IFS= read -r -d '' dir; do
    # Skip if directory contains no .mdx files
    if ! find "$dir" -maxdepth 1 -name "*.mdx" -type f | grep -q .; then
        continue
    fi
    
    create_meta_json "$dir"
    echo ""
    
done < <(find . -type d -print0 | sort -z)

echo "meta.json generation complete!"