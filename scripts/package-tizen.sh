#!/usr/bin/env bash
# Package Chula OS as a signed Tizen .wgt.
# Default: FAIL if Tizen CLI or security profile is missing (no silent "success").
# Optional: ALLOW_UNSIGNED=1 also writes a structural UNSIGNED.wgt for inspection,
#           but still exits non-zero so CI/scripts cannot treat it as installable.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIZEN="$ROOT/tizen/ChulaOS"
OUT="$ROOT/tizen/release"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"
ALLOW_UNSIGNED="${ALLOW_UNSIGNED:-0}"

write_status() {
  local status="$1"
  local artifact="${2:-}"
  local reason="${3:-}"
  {
    echo "STATUS=$status"
    [[ -n "$artifact" ]] && echo "artifact=$artifact"
    [[ -n "$reason" ]] && echo "reason=$reason"
    if [[ "$status" == "SIGNED" ]]; then
      echo "installable_on_tv=YES"
      echo "next_steps=Package is local and gitignored. Sideload with ./scripts/deploy-tizen.sh only when you intend to install, then complete docs/tizen/VERIFY_ON_DEVICE.md. Do not commit the .wgt, signatures, or certificates."
    else
      echo "installable_on_tv=NO"
      echo "next_steps=Install Tizen Studio + TV Extensions 9.0+ + Certificate Extension (>=2.0.73); create Samsung Author+Distributor certs with the TV DUID; set TIZEN_SECURITY_PROFILE; re-run ./scripts/package-tizen.sh"
    fi
  } > "$OUT/SIGNING_STATUS.txt"
}

fail_unsigned() {
  local reason="$1"
  mkdir -p "$OUT"
  if [[ "$ALLOW_UNSIGNED" == "1" ]]; then
    local unsigned="$OUT/chula-os-${VERSION}-tizen-UNSIGNED.wgt"
    (
      cd "$TIZEN"
      zip -qr "$unsigned" . -x "*.DS_Store" "*.wgt"
    )
    write_status "UNSIGNED" "$(basename "$unsigned")" "$reason"
    echo "==> Created UNSIGNED structural package (not installable): $unsigned"
  else
    write_status "UNSIGNED" "" "$reason"
  fi
  echo "ERROR: Signed .wgt was NOT produced."
  echo "       $reason"
  echo "       See $OUT/SIGNING_STATUS.txt"
  echo "       Tip: ALLOW_UNSIGNED=1 ./scripts/package-tizen.sh  # structural zip only; still fails"
  cat "$OUT/SIGNING_STATUS.txt"
  exit 1
}

"$ROOT/scripts/sync-tizen.sh"
"$ROOT/scripts/verify-tizen-project.sh"

mkdir -p "$OUT"
rm -f "$OUT"/*.wgt "$OUT"/*.zip "$OUT"/SIGNING_STATUS.txt

echo "==> Packaging Tizen widget v${VERSION}"

# Prefer tools from a standard Tizen Studio install if not already on PATH
if ! command -v tizen >/dev/null 2>&1; then
  for candidate in \
    "$HOME/tizen-studio/tools/ide/bin" \
    "/opt/tizen-studio/tools/ide/bin"; do
    if [[ -x "$candidate/tizen" ]]; then
      export PATH="$candidate:$HOME/tizen-studio/tools:${PATH:-}"
      break
    fi
  done
fi

if ! command -v tizen >/dev/null 2>&1; then
  fail_unsigned "Tizen CLI (tizen) not found. Install Tizen Studio and add tools/ide/bin to PATH."
fi

echo "Tizen CLI found: $(command -v tizen)"
tizen version 2>/dev/null || true

PROFILE="${TIZEN_SECURITY_PROFILE:-}"
if [[ -z "$PROFILE" ]]; then
  PROFILE="$(tizen security-profiles list 2>/dev/null | awk '/Name/ {print $NF; exit}')" || true
fi

if [[ -z "${PROFILE}" ]]; then
  fail_unsigned "No Tizen security profile available. Create one in Certificate Manager, then: TIZEN_SECURITY_PROFILE=YourProfile ./scripts/package-tizen.sh"
fi

echo "Signing with security profile: $PROFILE"
rm -f "$TIZEN"/*.wgt
(
  cd "$TIZEN"
  tizen package -t wgt -s "$PROFILE" -- "$TIZEN"
)

WGT="$(find "$TIZEN" -maxdepth 1 -name '*.wgt' | head -1)"
if [[ -z "$WGT" ]]; then
  fail_unsigned "tizen package ran with profile '$PROFILE' but no .wgt was produced (certificate/password/profile error likely)."
fi

SIGNED="$OUT/chula-os-${VERSION}-tizen-signed.wgt"
cp "$WGT" "$SIGNED"
write_status "SIGNED" "$(basename "$SIGNED")" "profile=$PROFILE"
echo "profile=$PROFILE" >> "$OUT/SIGNING_STATUS.txt"

echo "==> Signed package: $SIGNED"
ls -la "$OUT"
exit 0
