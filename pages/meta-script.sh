#!/usr/bin/env bash
#
# create_meta_jsons.sh
# Recursively discover every directory under a given root and ensure each
# contains an empty JSON metadata stub called _meta.json.
#
# Usage: ./create_meta_jsons.sh /absolute/or/relative/path
#
# Exit codes:
#   0 – success
#   1 – missing/invalid argument or unreadable directory

set -euo pipefail

###############################################################################
# 1. Guard‑clauses & argument sanitation
###############################################################################
if [[ $# -ne 1 ]]; then
  printf "Usage: %s <root-directory>\n" "$(basename "$0")" >&2
  exit 1
fi

ROOT="$1"

# Resolve to an absolute path for clarity and verify it is a directory.
if ! ROOT_ABS="$(cd "$ROOT" 2>/dev/null && pwd -P)"; then
  printf "Error: %s is not a readable directory\n" "$ROOT" >&2
  exit 1
fi

###############################################################################
# 2. Walk the directory tree and create _meta.json where missing
###############################################################################
# Using find(1) avoids subshell loops and handles hundreds of thousands
# of entries efficiently.  -print0 / xargs -0 makes the pipeline safe for
# paths with whitespace or strange characters.
find "$ROOT_ABS" -type d -print0 |
  while IFS= read -r -d '' dir; do
    meta_file="$dir/_meta.json"
    if [[ ! -e $meta_file ]]; then
      printf "{}\n" > "$meta_file"
      printf "Created %s\n" "$meta_file"
    fi
  done

###############################################################################
# 3. Epilogue
###############################################################################
printf "All done. Every directory under %s now contains _meta.json (if missing).\n" "$ROOT_ABS"
