find src -type f | sort | while read file; do
    echo "$file"
    echo ""
    echo '```ts'
    cat "$file"
    echo '```'
    echo ""
    echo "---"
    echo ""
done > src_dump.tmp