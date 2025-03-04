#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Add hooks here
npx husky add .husky/pre-push 'pnpm fix'