#!/usr/bin/env bash
# Build production dist/ for Chula OS web TV launcher
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"

echo "==> Building Chula OS v${VERSION}"
rm -rf "$DIST"
mkdir -p "$DIST/js" "$DIST/assets/fonts" "$DIST/icons"

copy() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  cp -R "$src" "$dest"
}

copy "$ROOT/index.html" "$DIST/index.html"
copy "$ROOT/styles.css" "$DIST/styles.css"
copy "$ROOT/styles-app.css" "$DIST/styles-app.css"
copy "$ROOT/manifest.webmanifest" "$DIST/manifest.webmanifest"
copy "$ROOT/sw.js" "$DIST/sw.js"
copy "$ROOT/VERSION" "$DIST/VERSION"
copy "$ROOT/README.md" "$DIST/README.md"
copy "$ROOT/docs" "$DIST/docs"

for f in config storage registry tizen-bridge ui launcher router boot home entertainment library settings main; do
  copy "$ROOT/js/${f}.js" "$DIST/js/${f}.js"
done

copy "$ROOT/assets/wallpaper.jpg" "$DIST/assets/wallpaper.jpg"
copy "$ROOT/assets/wallpaper.svg" "$DIST/assets/wallpaper.svg"
copy "$ROOT/assets/fonts/." "$DIST/assets/fonts/"
copy "$ROOT/icons/." "$DIST/icons/"

# Stamp version into a small build info file
cat > "$DIST/BUILD.txt" <<EOF
Chula OS ${VERSION}
platform: web-tv-launcher (PWA)
built: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

# Zip artifact
(
  cd "$DIST"
  zip -qr "$ROOT/dist/chula-os-${VERSION}-web.zip" . -x "*.DS_Store" "chula-os-*.zip"
)

echo "==> Dist ready: $DIST"
echo "==> Artifact: $DIST/chula-os-${VERSION}-web.zip"
ls -la "$DIST" | head -40
