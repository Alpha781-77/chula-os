#!/usr/bin/env bash
# Offline structural checks for the Tizen project (no SDK/TV required).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIZEN="$ROOT/tizen/ChulaOS"
CFG="$TIZEN/config.xml"
ERR=0

fail() { echo "FAIL: $*"; ERR=1; }
ok() { echo "OK: $*"; }

echo "==> Verifying Tizen project structure"

[[ -f "$CFG" ]] || { echo "FATAL: missing config.xml"; exit 1; }

# App ID / package
if grep -q 'id="ChulaKenya.ChulaOS"' "$CFG"; then
  ok "application id ChulaKenya.ChulaOS"
else
  fail "expected tizen:application id ChulaKenya.ChulaOS"
fi
if grep -q 'package="ChulaKenya"' "$CFG"; then
  ok "package id ChulaKenya (10 alphanumeric)"
else
  fail "expected package=\"ChulaKenya\""
fi

# Privileges
for priv in \
  "http://tizen.org/privilege/tv.inputdevice" \
  "http://tizen.org/privilege/application.launch" \
  "http://tizen.org/privilege/application.info" \
  "http://tizen.org/privilege/internet" \
  "http://developer.samsung.com/privilege/network.public" \
  "http://developer.samsung.com/privilege/productinfo"; do
  if grep -qF "$priv" "$CFG"; then
    ok "privilege $priv"
  else
    fail "missing privilege $priv"
  fi
done

# Profile + content
grep -q 'tizen:profile name="tv-samsung"' "$CFG" && ok "profile tv-samsung" || fail "tv-samsung profile"
grep -q 'content src="index.html"' "$CFG" && ok "content index.html" || fail "content src"
grep -q 'icon src="icon.png"' "$CFG" && ok "icon.png declared" || fail "icon declaration"

# Required files
for f in index.html styles.css styles-app.css icon.png icon-large.png \
  js/main.js js/tizen-bridge.js js/launcher.js js/config.js \
  assets/wallpaper.jpg assets/fonts/space-grotesk-latin.woff2; do
  if [[ -f "$TIZEN/$f" ]]; then
    ok "file $f"
  else
    fail "missing $f"
  fi
done

# Must NOT ship PWA pieces
for f in sw.js manifest.webmanifest; do
  if [[ -e "$TIZEN/$f" ]]; then
    fail "PWA file must not be in Tizen package: $f"
  else
    ok "absent $f"
  fi
done

# CSP / no inline scripts
if grep -qE '<script[[:space:]]*>' "$TIZEN/index.html"; then
  fail "inline <script> in index.html (breaks CSP script-src 'self')"
else
  ok "no inline scripts in index.html"
fi

# Bridge registers remotes / launch / exit
grep -q '10009' "$TIZEN/js/tizen-bridge.js" && ok "Back keyCode 10009 defined" || fail "Back keyCode"
grep -q '10182' "$TIZEN/js/tizen-bridge.js" && ok "Exit keyCode 10182 defined" || fail "Exit keyCode"
grep -q 'launchAppControl' "$TIZEN/js/tizen-bridge.js" && ok "ApplicationControl launch bridge" || fail "AppControl"
grep -q 'exitApp' "$TIZEN/js/tizen-bridge.js" && ok "exitApp present" || fail "exitApp"
grep -q '_handleTizenBack' "$TIZEN/js/main.js" && ok "Back handler in main.js" || fail "Back handler"

# Smart Hub / Home intercept must not appear as product claims in active XML
# (strip comments first so documentation notes cannot false-positive)
CFG_ACTIVE="$(sed 's/<!--.*-->//g' "$CFG" | tr '\n' ' ')"
if echo "$CFG_ACTIVE" | grep -qiE 'replace[[:space:]]+smart[[:space:]]*hub|intercept[[:space:]]+home|permanently[[:space:]]+replace'; then
  fail "config must not claim Smart Hub / Home replacement"
else
  ok "no Smart Hub replacement claims in config.xml"
fi

if [[ "$ERR" -ne 0 ]]; then
  echo "==> verify-tizen-project: FAILED"
  exit 1
fi
echo "==> verify-tizen-project: PASSED"
exit 0
