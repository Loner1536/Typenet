#!/usr/bin/env bash
# dump.sh — compact source dump for AI context
# Usage: ./dump.sh [dir] [ext_filter]
# Examples:
#   ./dump.sh src
#   ./dump.sh src ts
#   ./dump.sh . "ts|js|json"

DIR="${1:-.}"
EXT="${2:-}"

if [ ! -d "$DIR" ]; then
    echo "Error: '$DIR' is not a directory" >&2
    exit 1
fi

# Build find command
if [ -n "$EXT" ]; then
    FILES=$(find "$DIR" -type f | grep -E "\.(${EXT})$" | sort)
else
    FILES=$(find "$DIR" -type f | sort)
fi

# Count for header
TOTAL=$(echo "$FILES" | grep -c .)

echo "# src:$DIR n:$TOTAL"
echo ""

echo "$FILES" | while IFS= read -r file; do
    # Strip leading ./ for cleanliness
    CLEAN="${file#./}"
    # Get extension for code fence lang hint
    EXT_HINT="${CLEAN##*.}"
    echo "## $CLEAN"
    echo "\`\`\`${EXT_HINT}"
    # Strip blank lines and trailing whitespace to reduce tokens
    sed 's/[[:space:]]*$//' "$file" | cat -s
    echo "\`\`\`"
    echo ""
done
