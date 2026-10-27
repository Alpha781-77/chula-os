#!/usr/bin/env bash
# Read-only environment probe for Chula OS → Samsung U6000F (Tizen 9.0).
# Does NOT install software or change security settings.
set -euo pipefail

PASS=0
FAIL=0
WARN=0

pass() { echo "  [PASS] $*"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $*"; FAIL=$((FAIL + 1)); }
warn() { echo "  [WARN] $*"; WARN=$((WARN + 1)); }
info() { echo "  [INFO] $*"; }

echo "=============================================="
echo " Chula OS — Tizen SDK readiness (read-only)"
echo " Target TV: Samsung Crystal UHD U6000F"
echo " Platform:  Tizen 9.0 / TV Extension 9.0+"
echo " Host:      $(uname -s) $(uname -m) | $(sw_vers -productName 2>/dev/null) $(sw_vers -productVersion 2>/dev/null)"
echo "=============================================="
echo

echo "== Host compatibility (official baseline)"
# Tizen Studio docs list macOS 11.4/12.3 x64, 3GB+ RAM, 6GB disk; Studio 3.7+ bundles JDK.
# This Mac is Ventura 13.x Intel — typically works; install under $HOME to avoid Mac Java path bugs.
ARCH="$(uname -m)"
if [[ "$ARCH" == "x86_64" || "$ARCH" == "arm64" ]]; then
  pass "64-bit CPU ($ARCH)"
else
  fail "Unsupported CPU architecture: $ARCH (need 64-bit)"
fi

MEM_BYTES="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
if [[ "$MEM_BYTES" -le 0 ]]; then
  warn "Could not read hw.memsize (sandbox or restricted host) — official minimum is ≥ 3 GB"
else
  MEM_GB=$((MEM_BYTES / 1024 / 1024 / 1024))
  if [[ "$MEM_GB" -ge 3 ]]; then
    pass "RAM ${MEM_GB} GB (need ≥ 3 GB)"
  else
    fail "RAM ${MEM_GB} GB — below 3 GB official minimum"
  fi
fi

OS_VER="$(sw_vers -productVersion 2>/dev/null || echo unknown)"
info "macOS $OS_VER — official docs list 11.4/12.3; Ventura/Sonoma usually OK for current Studio"
info "Install Tizen Studio under \$HOME (e.g. ~/tizen-studio) on Mac to avoid Java path errors"

echo
echo "== Package managers / existing installs (nothing will be installed)"
if command -v brew >/dev/null 2>&1; then
  pass "Homebrew present: $(command -v brew)"
  info "Optional JDK (only if Studio < 3.7): brew install --cask temurin"
else
  warn "Homebrew not installed — not required for Tizen Studio 3.7+ (bundled JDK)"
  info "If you want brew later: https://brew.sh (asks for your approval / password)"
fi

JAVA_OK=0
if command -v java >/dev/null 2>&1 && java -version >/dev/null 2>&1; then
  pass "Java runtime available: $(java -version 2>&1 | head -1)"
  JAVA_OK=1
else
  # Studio 3.7+ does not require a separate JDK
  warn "No system JDK — OK if you install Tizen Studio 3.7+ (JDK bundled)"
fi

if /usr/libexec/java_home >/dev/null 2>&1; then
  pass "java_home: $(/usr/libexec/java_home 2>/dev/null)"
  JAVA_OK=1
else
  info "java_home empty"
fi

TIZEN_ROOT=""
for d in "$HOME/tizen-studio" "/opt/tizen-studio"; do
  if [[ -d "$d" ]]; then
    TIZEN_ROOT="$d"
    break
  fi
done

if [[ -n "$TIZEN_ROOT" ]]; then
  pass "Tizen Studio directory: $TIZEN_ROOT"
else
  fail "Tizen Studio not found under ~/tizen-studio"
fi

# Put candidate tools on PATH for this probe only
if [[ -n "$TIZEN_ROOT" ]]; then
  export PATH="$TIZEN_ROOT/tools/ide/bin:$TIZEN_ROOT/tools:${PATH:-}"
fi

if command -v tizen >/dev/null 2>&1; then
  pass "tizen CLI: $(command -v tizen)"
  tizen version 2>/dev/null | head -3 | while read -r line; do info "$line"; done || true
else
  fail "tizen CLI not on PATH"
fi

if command -v sdb >/dev/null 2>&1; then
  pass "sdb: $(command -v sdb)"
  sdb version 2>/dev/null | head -2 | while read -r line; do info "$line"; done || true
else
  fail "sdb not on PATH"
fi

# Certificate Extension hint via package list if available
if [[ -n "$TIZEN_ROOT" && -x "$TIZEN_ROOT/package-manager/package-manager-cli.bin" ]]; then
  info "Package Manager CLI present — check Extension SDK for TV Extensions 9.0+ and Certificate Extension"
elif [[ -n "$TIZEN_ROOT" ]]; then
  warn "Could not find package-manager-cli.bin — open GUI Package Manager after install"
fi

if command -v tizen >/dev/null 2>&1; then
  if tizen security-profiles list >/tmp/chula-tizen-profiles-check.txt 2>/dev/null; then
    # Real profiles print a Name column with a value; empty table is not ready
    PROFILE_COUNT="$(awk '/\[Profile Name\]/ {next} NF>=1 && $1 !~ /^Loaded/ && $1 !~ /^\[/ {c++} END{print c+0}' /tmp/chula-tizen-profiles-check.txt)"
    if [[ "$PROFILE_COUNT" -gt 0 ]] && grep -qE '[[:alnum:]_-]+' /tmp/chula-tizen-profiles-check.txt; then
      # Require at least one non-header profile name line with content beyond Active column markers
      NAMES="$(tizen security-profiles list 2>/dev/null | awk 'NR>2 && NF && $1 !~ /^Loaded/ {print $1}' | grep -v '^\[Profile' || true)"
      if [[ -n "${NAMES//[[:space:]]/}" ]]; then
        pass "Security profile(s) present"
        cat /tmp/chula-tizen-profiles-check.txt | sed 's/^/         /'
      else
        fail "No security profiles — create Samsung Author+Distributor in Certificate Manager"
        cat /tmp/chula-tizen-profiles-check.txt | sed 's/^/         /'
      fi
    else
      fail "No security profiles — create Samsung Author+Distributor in Certificate Manager"
      cat /tmp/chula-tizen-profiles-check.txt | sed 's/^/         /'
    fi
  else
    fail "Cannot list security profiles (Certificate Extension / profiles missing)"
  fi
else
  fail "Cannot check security profiles without tizen CLI"
fi

echo
echo "== Project artifacts (this repo)"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/tizen/ChulaOS/config.xml" ]]; then
  pass "Tizen project config.xml present"
else
  fail "Missing tizen/ChulaOS/config.xml"
fi

if [[ -f "$ROOT/tizen/release/SIGNING_STATUS.txt" ]]; then
  info "Last package status:"
  sed 's/^/         /' "$ROOT/tizen/release/SIGNING_STATUS.txt"
  if grep -q 'STATUS=SIGNED' "$ROOT/tizen/release/SIGNING_STATUS.txt"; then
    pass "Last package was SIGNED"
  else
    warn "Last package was NOT signed (expected until SDK+certs exist)"
  fi
fi

echo
echo "=============================================="
echo " Summary: PASS=$PASS  WARN=$WARN  FAIL=$FAIL"
echo "=============================================="
if [[ "$FAIL" -gt 0 ]]; then
  echo
  echo "Next: read docs/tizen/TIZEN_DEPLOYMENT.md § Setup checklist"
  echo "Then approve installs (Studio + extensions). No software was installed by this script."
  exit 1
fi
echo "SDK probe looks ready. Next: create/confirm certs, then ./scripts/package-tizen.sh"
exit 0
