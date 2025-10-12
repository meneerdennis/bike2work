#!/usr/bin/env bash
# Simple pre-commit secret detector for staged files.
# Exits non-zero if a likely secret is found.

set -euo pipefail

# Patterns to check (add more as needed)
PATTERNS=(
  "AIza[0-9A-Za-z_-]{35}" # Google API key (partial heuristic)
  "-----BEGIN PRIVATE KEY-----" # private key blocks
  "REACT_APP_FIREBASE_API_KEY="
)

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  exit 0
fi

FOUND=0

for file in $STAGED_FILES; do
  # Only check text files
  if file --brief --mime-type "$file" | grep -q text; then
    for pat in "${PATTERNS[@]}"; do
      if git show :"$file" | grep -E --line-number "$pat" > /dev/null 2>&1; then
        echo "Potential secret found in $file (pattern: $pat)"
        FOUND=1
      fi
    done
  fi
done

if [ $FOUND -eq 1 ]; then
  echo "\nCommit blocked: possible secrets found. Remove them or add to .gitignore if appropriate." >&2
  exit 1
fi

exit 0
