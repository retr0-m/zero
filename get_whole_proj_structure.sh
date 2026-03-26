find . -type f \
    \( -name "*.py" -o -name "*.html" -o -name "*.txt" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" \) \
    -not -path "*/__pycache__/*" \
    -not -path "*/.venv/*" \
    -not -path "*/venv/*" \
    -not -path "*/vvv/*" \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/.next/*" \
| sort | while read f; do
    echo "===== $f =====" >> prompt.txt
    cat "$f" >> prompt.txt
    echo -e "\n" >> prompt.txt
done