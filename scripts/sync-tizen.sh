#!/usr/bin/env bash
# Sync production web assets into the Tizen TV project (keeps config.xml + icons)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIZEN="$ROOT/tizen/ChulaOS"

echo "==> Syncing Chula OS → Tizen project"
mkdir -p "$TIZEN/js" "$TIZEN/assets/fonts" "$TIZEN/icons"

# Core web UI (no inline scripts — CSP-safe for Tizen)
cp "$ROOT/index.html" "$TIZEN/index.html"
cp "$ROOT/styles.css" "$TIZEN/styles.css"
cp "$ROOT/styles-app.css" "$TIZEN/styles-app.css"

# JS modules (including Tizen bridge)
for f in config storage registry tizen-bridge ui launcher router boot home entertainment library settings main; do
  cp "$ROOT/js/${f}.js" "$TIZEN/js/${f}.js"
done

# Assets
cp "$ROOT/assets/wallpaper.jpg" "$TIZEN/assets/wallpaper.jpg"
cp "$ROOT/assets/wallpaper.svg" "$TIZEN/assets/wallpaper.svg"
cp "$ROOT/assets/fonts/"*.woff2 "$TIZEN/assets/fonts/"
cp "$ROOT/icons/icon-192.png" "$TIZEN/icons/icon-192.png"
cp "$ROOT/icons/icon-512.png" "$TIZEN/icons/icon-512.png"

# Ensure Tizen does not ship PWA service worker / web manifest
rm -f "$TIZEN/sw.js" "$TIZEN/manifest.webmanifest"

# Require config.xml + icons
if [[ ! -f "$TIZEN/config.xml" ]]; then
  echo "ERROR: missing config.xml"
  exit 1
fi
if [[ ! -f "$TIZEN/icon.png" ]]; then
  echo "ERROR: missing icon.png"
  exit 1
fi

# Guard: reject accidental inline <script> blocks (CSP script-src 'self')
if grep -qE '<script[[:space:]]*>' "$TIZEN/index.html"; then
  echo "ERROR: inline <script> found in Tizen index.html — forbidden by CSP"
  exit 1
fi

echo "==> Tizen project ready at $TIZEN"
find "$TIZEN" -type f | wc -l | awk '{print "files:", $1}'
