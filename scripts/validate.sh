#!/usr/bin/env bash
# Validate Chula OS structure, syntax, and basic integrity
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0

echo "==> Chula OS validation"

need() {
  if [[ ! -f "$1" ]]; then
    echo "MISSING: $1"
    FAIL=1
  fi
}

need index.html
need styles.css
need styles-app.css
need manifest.webmanifest
need sw.js
need VERSION
need js/config.js
need js/storage.js
need js/registry.js
need js/tizen-bridge.js
need js/ui.js
need js/launcher.js
need js/router.js
need js/boot.js
need js/home.js
need js/entertainment.js
need js/library.js
need js/settings.js
need js/main.js
need assets/wallpaper.jpg
need assets/wallpaper.svg
need icons/icon-192.png
need icons/icon-512.png
need tizen/ChulaOS/config.xml
need docs/tizen/TIZEN_DEPLOYMENT.md

# HTML must load modules (not legacy single app.js as sole entry)
if ! grep -q 'js/main.js' index.html; then
  echo "FAIL: index.html does not load js/main.js"
  FAIL=1
fi

if grep -q 'src="app.js' index.html; then
  echo "FAIL: index.html still references legacy app.js"
  FAIL=1
fi

# Boot branding copy
for s in "EXPERIENCE CHULA OS" "Proudly made in Kenya"; do
  if ! grep -q "$s" index.html; then
    echo "FAIL: missing boot string: $s"
    FAIL=1
  fi
done

# JS syntax check via node or python fallback
if command -v node >/dev/null 2>&1; then
  for f in js/*.js; do
    node --check "$f" || { echo "FAIL syntax: $f"; FAIL=1; }
  done
else
  python3 - <<'PY' || FAIL=1
from pathlib import Path
# Lightweight sanity: balanced braces
root = Path('js')
for p in sorted(root.glob('*.js')):
    text = p.read_text(encoding='utf-8')
    if text.count('{') != text.count('}'):
        print('FAIL brace balance:', p)
        raise SystemExit(1)
print('JS brace balance OK')
PY
fi

# Wallpaper dimensions note
python3 - <<'PY'
from pathlib import Path
p = Path('assets/wallpaper.jpg')
print('wallpaper bytes', p.stat().st_size)
PY

# Run node unit tests if present
if [[ -f tests/validate.mjs ]]; then
  if command -v node >/dev/null 2>&1; then
    node tests/validate.mjs || FAIL=1
  else
    python3 tests/validate.py || FAIL=1
  fi
elif [[ -f tests/validate.py ]]; then
  python3 tests/validate.py || FAIL=1
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "==> VALIDATION FAILED"
  exit 1
fi
echo "==> VALIDATION PASSED"
