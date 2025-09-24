#!/bin/bash

# Directory Scanner to CSV - Shell Script
# Recursively scans a directory and outputs all file paths to CSV
# Ignores files named "meta.json"

# Function to display usage
show_usage() {
    echo "Usage: $0 <input-directory> [output-file.csv]"
    echo "Example: $0 ./pages files-list.csv"
    echo "Example: $0 /path/to/directory"
    echo ""
    echo "This script will:"
    echo "  - Recursively scan the input directory"
    echo "  - Find all files except 'meta.json' files"
    echo "  - Output results to CSV with full paths and file info"
    exit 1
}

# Function to escape CSV fields
escape_csv() {
    # Replace quotes with double quotes and wrap in quotes
    echo "\"$(echo "$1" | sed 's/"/""/g')\""
}

# Function to get file size (cross-platform)
get_file_size() {
    local file="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        stat -f%z "$file" 2>/dev/null || echo "0"
    else
        # Linux
        stat -c%s "$file" 2>/dev/null || echo "0"
    fi
}

# Function to get relative path
get_relative_path() {
    local file="$1"
    local base_dir="$2"
    
    # Use realpath if available, otherwise use basic substitution
    if command -v realpath >/dev/null 2>&1; then
        local abs_file=$(realpath "$file")
        local abs_base=$(realpath "$base_dir")
        echo "${abs_file#$abs_base/}"
    else
        # Fallback method
        echo "${file#$base_dir/}"
    fi
}

# Main function
main() {
    # Check arguments
    if [[ $# -eq 0 ]]; then
        show_usage
    fi
    
    local input_dir="$1"
    local output_file="${2:-directory-scan.csv}"
    
    # Validate input directory
    if [[ ! -d "$input_dir" ]]; then
        echo "Error: Directory '$input_dir' does not exist or is not a directory"
        exit 1
    fi
    
    # Convert to absolute path
    if command -v realpath >/dev/null 2>&1; then
        input_dir=$(realpath "$input_dir")
    else
        input_dir=$(cd "$input_dir" && pwd)
    fi
    
    echo "Scanning directory: $input_dir"
    echo "Output file: $output_file"
    echo "Ignoring: meta.json files"
    echo ""
    
    # Create CSV header
    echo "\"Full Path\",\"Relative Path\",\"File Name\",\"Extension\",\"Directory\",\"Size (bytes)\"" > "$output_file"
    
    local file_count=0
    local temp_file=$(mktemp)
    
    # Find all files recursively, excluding meta.json files
    find "$input_dir" -type f -name "*.json" -name "meta.json" -prune -o -type f -print | \
    while IFS= read -r file; do
        # Skip if this is a meta.json file (double check)
        if [[ "$(basename "$file")" == "meta.json" ]]; then
            continue
        fi
        
        # Get file information
        local full_path="$file"
        local relative_path=$(get_relative_path "$file" "$input_dir")
        local file_name=$(basename "$file")
        local extension="${file_name##*.}"
        local directory=$(dirname "$relative_path")
        local size=$(get_file_size "$file")
        
        # Handle case where file has no extension
        if [[ "$extension" == "$file_name" ]]; then
            extension=""
        else
            extension=".$extension"
        fi
        
        # Handle root directory case
        if [[ "$directory" == "." ]]; then
            directory="."
        fi
        
        # Create CSV row
        local csv_row="$(escape_csv "$full_path"),$(escape_csv "$relative_path"),$(escape_csv "$file_name"),$(escape_csv "$extension"),$(escape_csv "$directory"),$size"
        
        # Append to temp file (to count files)
        echo "$csv_row" >> "$temp_file"
        
    done
    
    # Sort the temp file and append to output
    if [[ -s "$temp_file" ]]; then
        sort "$temp_file" >> "$output_file"
        file_count=$(wc -l < "$temp_file")
    fi
    
    # Clean up
    rm -f "$temp_file"
    
    if [[ $file_count -eq 0 ]]; then
        echo "No files found in the directory (excluding meta.json files)"
        # Remove the CSV file if no content
        rm -f "$output_file"
        exit 0
    fi
    
    echo "Found $file_count files (excluding meta.json)"
    echo "CSV file created: $output_file"
    
    # Show preview of first few files
    echo ""
    echo "First few files found:"
    tail -n +2 "$output_file" | head -5 | while IFS=, read -r full_path relative_path file_name extension directory size; do
        # Remove quotes for display
        relative_clean=$(echo "$relative_path" | sed 's/^"//; s/"$//')
        size_clean=$(echo "$size" | sed 's/^"//; s/"$//')
        echo "  $relative_clean ($size_clean bytes)"
    done
    
    if [[ $file_count -gt 5 ]]; then
        echo "  ... and $((file_count - 5)) more files"
    fi
}

# Run the main function with all arguments
main "$@"