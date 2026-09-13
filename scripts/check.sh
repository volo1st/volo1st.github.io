#!/usr/bin/env bash

set -euo pipefail

repository_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repository_dir"

for command_name in find git node; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is not available: $command_name" >&2
    exit 1
  fi
done

echo "Check JavaScript syntax."
while IFS= read -r -d '' javascript_file; do
  node --check "$javascript_file"
done < <(find . -type f -name '*.js' -not -path './.git/*' -print0)

echo "Check shell syntax."
while IFS= read -r -d '' shell_file; do
  bash -n "$shell_file"
done < <(find . -type f -name '*.sh' -not -path './.git/*' -print0)

echo "Run automated tests."
node --test tests/*.test.js

echo "Check unstaged whitespace."
git diff --check

echo "Check staged whitespace."
git diff --cached --check

echo "All local checks passed."
