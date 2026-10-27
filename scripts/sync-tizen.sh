#!/usr/bin/env bash
# Sync production web assets into the Tizen TV project (keeps config.xml + icons)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIZEN="$ROOT/tizen/ChulaOS"

echo "==> Syncing Chula OS → Tizen project"
mkdir -p "$TIZEN/js" "$TIZEN/assets/fonts" "$TIZEN/icons"

# Core web UI
cp "$ROOT/index.html" "$TIZEN/index.html"
cp "$ROOT/styles.css" "$TIZEN/styles.css"
cp "$ROOT/styles-app.css" "$TIZEN/styles-app.css"

# JS modules (including Tizen bridge)
for f in config storage registry tizen-bridge ui launcher router boot home library settings main; do
  cp "$ROOT/js/${f}.js" "$TIZEN/js/${f}.js"
done

# Assets
cp "$ROOT/assets/wallpaper.jpg" "$TIZEN/assets/wallpaper.jpg"
cp "$ROOT/assets/wallpaper.svg" "$TIZEN/assets/wallpaper.svg"
cp "$ROOT/assets/fonts/"*.woff2 "$TIZEN/assets/fonts/"
cp "$ROOT/icons/icon-192.png" "$TIZEN/icons/icon-192.png"
cp "$ROOT/icons/icon-512.png" "$TIZEN/icons/icon-512.png"

# Ensure Tizen does not depend on PWA service worker / web manifest
rm -f "$TIZEN/sw.js" "$TIZEN/manifest.webmanifest"

# Strip service-worker registration from Tizen index (belt-and-suspenders)
python3 - <<'PY'
from pathlib import Path
p = Path("/Applications/Chula Os/tizen/ChulaOS/index.html")
text = p.read_text(encoding="utf-8")
# Force-disable SW block on Tizen package copy
text = text.replace(
    'var isTizen = typeof tizen !== "undefined";',
    'var isTizen = true; // packaged Tizen build — never register SW',
)
p.write_text(text, encoding="utf-8")
print("patched index.html for Tizen (SW disabled)")
PY

# Require config.xml
if [[ ! -f "$TIZEN/config.xml" ]]; then
  echo "ERROR: missing config.xml"
  exit 1
fi
if [[ ! -f "$TIZEN/icon.png" ]]; then
  echo "ERROR: missing icon.png"
  exit 1
fi

echo "==> Tizen project ready at $TIZEN"
find "$TIZEN" -type f | wc -l | awk '{print "files:", $1}'
