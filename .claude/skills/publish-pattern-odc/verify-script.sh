#!/usr/bin/env bash
# Compares the Script an ODC app serves with the local bundle.
#
# Usage: verify-script.sh <app-url> <script-name> <local-bundle> [work-dir]
#   app-url       the app's runtime URL from env_app, e.g. https://<host>/<App>
#   script-name   the Script resource name, e.g. GreetingCard
#   local-bundle  path to dist/<Name>.js
#   work-dir      where to save the downloaded copy (default: a temp dir)
#
# Prints the published path, sizes, line counts, BOM, final newline, CRLF
# count and the diff after stripping the BOM. Exits 0 when the code is
# identical apart from the BOM and the final newline ODC drops, 1 otherwise.
set -u

APP_URL="${1:?app url}"
NAME="${2:?script name}"
LOCAL="${3:?local bundle}"
WORK="${4:-$(mktemp -d)}"
mkdir -p "$WORK"

ORIGIN=$(printf '%s' "$APP_URL" | sed -E 's#^(https?://[^/]+).*#\1#')
PUBLISHED_PATH=$(curl -fsS "$APP_URL/moduleservices/moduleinfo" \
  | grep -o "/[^\"]*UserScripts\.${NAME}__[^\"]*\.js" | head -1)

if [ -z "$PUBLISHED_PATH" ]; then
  echo "NOT FOUND: no UserScripts.${NAME}__*.js in $APP_URL/moduleservices/moduleinfo"
  exit 1
fi

PUBLISHED="$WORK/published-${NAME}.js"
curl -fsS -o "$PUBLISHED" "$ORIGIN$PUBLISHED_PATH" || { echo "DOWNLOAD FAILED: $ORIGIN$PUBLISHED_PATH"; exit 1; }

bom=no
[ "$(head -c3 "$PUBLISHED" | od -An -tx1 | tr -d ' \n')" = "efbbbf" ] && bom=yes
final_nl=kept
[ -n "$(tail -c1 "$PUBLISHED")" ] && final_nl=dropped
crlf=$(tr -cd '\r' < "$PUBLISHED" | wc -c | tr -d ' ')

echo "published path : $PUBLISHED_PATH"
echo "saved to       : $PUBLISHED"
echo "local          : $(wc -c < "$LOCAL") bytes, $(wc -l < "$LOCAL") lines"
echo "published      : $(wc -c < "$PUBLISHED") bytes"
echo "BOM added      : $bom"
echo "final newline  : $final_nl"
echo "CRLF lines     : $crlf"

# Strip the BOM, restore a final newline, then compare.
NORMALISED="$WORK/published-${NAME}.normalised.js"
{ sed '1s/^\xEF\xBB\xBF//' "$PUBLISHED"; [ "$final_nl" = dropped ] && echo; } > "$NORMALISED"

if diff -q "$LOCAL" "$NORMALISED" > /dev/null; then
  echo "code           : IDENTICAL, line for line"
  exit 0
fi
echo "code           : DIFFERENT"
diff "$LOCAL" "$NORMALISED" | head -40
exit 1
