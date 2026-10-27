#!/usr/bin/env bash
# Package Chula OS as a Tizen .wgt (signed if CLI+certs exist; otherwise unsigned zip labeled clearly)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIZEN="$ROOT/tizen/ChulaOS"
OUT="$ROOT/tizen/release"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"

"$ROOT/scripts/sync-tizen.sh"

mkdir -p "$OUT"
rm -f "$OUT"/*.wgt "$OUT"/*.zip "$OUT"/SIGNING_STATUS.txt

echo "==> Packaging Tizen widget v${VERSION}"

if command -v tizen >/dev/null 2>&1; then
  echo "Tizen CLI found: $(command -v tizen)"
  # List profiles if possible
  if tizen security-profiles list >/tmp/chula-tizen-profiles.txt 2>/dev/null; then
    cat /tmp/chula-tizen-profiles.txt || true
  fi

  PROFILE="${TIZEN_SECURITY_PROFILE:-}"
  if [[ -z "$PROFILE" ]]; then
    # Try to pick the first non-empty profile name
    PROFILE="$(tizen security-profiles list 2>/dev/null | awk '/Name/ {print $NF; exit}')" || true
  fi

  if [[ -n "${PROFILE}" ]]; then
    echo "Signing with security profile: $PROFILE"
    (
      cd "$TIZEN"
      tizen package -t wgt -s "$PROFILE" -- "$TIZEN"
    )
    WGT="$(find "$TIZEN" -maxdepth 1 -name '*.wgt' | head -1)"
    if [[ -n "$WGT" ]]; then
      cp "$WGT" "$OUT/chula-os-${VERSION}-tizen-signed.wgt"
      echo "SIGNED_WGT=chula-os-${VERSION}-tizen-signed.wgt" > "$OUT/SIGNING_STATUS.txt"
      echo "profile=$PROFILE" >> "$OUT/SIGNING_STATUS.txt"
      echo "==> Signed package: $OUT/chula-os-${VERSION}-tizen-signed.wgt"
      ls -la "$OUT"
      exit 0
    fi
    echo "WARNING: tizen package ran but no .wgt found"
  else
    echo "WARNING: No Tizen security profile configured."
    echo "Create one in Tizen Studio (Certificate Manager) then re-run:"
    echo "  TIZEN_SECURITY_PROFILE=YourProfile ./scripts/package-tizen.sh"
  fi
else
  echo "Tizen CLI (tizen) not installed on this Mac."
fi

# Fallback: structural unsigned archive (WILL NOT install on a retail TV)
UNSIGNED="$OUT/chula-os-${VERSION}-tizen-UNSIGNED.wgt"
(
  cd "$TIZEN"
  zip -qr "$UNSIGNED" . -x "*.DS_Store" "*.wgt"
)

cat > "$OUT/SIGNING_STATUS.txt" <<EOF
STATUS=UNSIGNED
artifact=$(basename "$UNSIGNED")
reason=Tizen Studio CLI and/or Samsung certificate profile not available on this Mac
installable_on_tv=NO
next_steps=Install Tizen Studio + TV Extensions 9.0 + Certificate Extension; create Distributor+Author certs; enable Dev Mode on the U6000F; then re-run ./scripts/package-tizen.sh
EOF

echo "==> Created UNSIGNED structural package (not installable): $UNSIGNED"
echo "==> See $OUT/SIGNING_STATUS.txt"
cat "$OUT/SIGNING_STATUS.txt"
ls -la "$OUT"
