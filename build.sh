#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# build.sh  –  Build the NoPhoton Chromium extension
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$SCRIPT_DIR/extension"
DIST_DIR="$SCRIPT_DIR/dist"

echo "==> NoPhoton Extension Builder"

# ── 1. Generate icons ──────────────────────────────────────────────────────
echo "--> Generating icons..."
python3 "$SCRIPT_DIR/scripts/generate-icons.py" "$EXT_DIR/icons"

# ── 2. Validate manifest ───────────────────────────────────────────────────
echo "--> Validating manifest..."
if ! python3 -c "import json,sys; json.load(open('$EXT_DIR/manifest.json'))" 2>/dev/null; then
  echo "ERROR: manifest.json is not valid JSON" >&2
  exit 1
fi
echo "    manifest.json OK"

# ── 3. Copy unpacked extension into dist/ ─────────────────────────────────
mkdir -p "$DIST_DIR"
echo "--> Copying unpacked extension to dist/..."
rsync -a --delete \
  --exclude "*.DS_Store" --exclude "__MACOSX" \
  "$EXT_DIR/" "$DIST_DIR/"

# ── 4. Package into a zip ──────────────────────────────────────────────────
echo "--> Creating zip archive..."
OUTPUT="$SCRIPT_DIR/nophoton.zip"
rm -f "$OUTPUT"

# Build from inside dist/ so paths inside the zip are clean
(cd "$DIST_DIR" && zip -r "$OUTPUT" . --exclude "*.DS_Store" --exclude "__MACOSX/*")

echo ""
echo "==> Build complete!"
echo "    Unpacked : $DIST_DIR"
echo "    Zip      : $OUTPUT"
echo ""
echo "Load unpacked in Chrome/Brave:"
echo "  1. Open chrome://extensions"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked' and select:  $DIST_DIR"
