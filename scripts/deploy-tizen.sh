#!/usr/bin/env bash
# Connect / install / launch Chula OS on a Samsung Tizen TV (U6000F).
# Requires: Tizen Studio on PATH, signed .wgt, Developer Mode + same LAN.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"
WGT_SIGNED="$ROOT/tizen/release/chula-os-${VERSION}-tizen-signed.wgt"
APP_ID="ChulaKenya.ChulaOS"
PKG_ID="ChulaKenya"
TV_IP="${1:-${TIZEN_TV_IP:-}}"
PORT="${TIZEN_TV_PORT:-26101}"

# Prefer standard install paths
if ! command -v sdb >/dev/null 2>&1; then
  export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:${PATH:-}"
fi

usage() {
  cat <<EOF
Usage: $0 <TV_IP> [command]

Commands:
  connect   Connect SDB only (default if only IP given)
  devices   List devices
  duid      Print device DUID (after connect)
  install   Install signed .wgt
  launch    Launch ChulaKenya.ChulaOS
  status    Show signing status + devices
  all       connect → install → launch

Examples:
  $0 192.168.1.50 connect
  $0 192.168.1.50 duid
  $0 192.168.1.50 all

Env:
  TIZEN_TV_IP, TIZEN_TV_PORT (default 26101), TIZEN_SECURITY_PROFILE
EOF
}

need_tools() {
  command -v sdb >/dev/null 2>&1 || {
    echo "ERROR: sdb not found. Install Tizen Studio and add ~/tizen-studio/tools to PATH."
    exit 1
  }
  command -v tizen >/dev/null 2>&1 || {
    echo "ERROR: tizen CLI not found."
    exit 1
  }
}

need_ip() {
  [[ -n "$TV_IP" ]] || {
    usage
    echo "ERROR: TV IP required."
    exit 1
  }
}

need_signed() {
  if [[ ! -f "$WGT_SIGNED" ]]; then
    echo "ERROR: Signed package missing: $WGT_SIGNED"
    echo "       Run TIZEN_SECURITY_PROFILE=YourProfile ./scripts/package-tizen.sh first."
    if [[ -f "$ROOT/tizen/release/SIGNING_STATUS.txt" ]]; then
      cat "$ROOT/tizen/release/SIGNING_STATUS.txt"
    fi
    exit 1
  fi
  if [[ -f "$ROOT/tizen/release/SIGNING_STATUS.txt" ]] && ! grep -q 'STATUS=SIGNED' "$ROOT/tizen/release/SIGNING_STATUS.txt"; then
    echo "ERROR: SIGNING_STATUS.txt is not STATUS=SIGNED — refusing install of non-signed artifact."
    cat "$ROOT/tizen/release/SIGNING_STATUS.txt"
    exit 1
  fi
}

cmd="${2:-connect}"
need_tools

case "$cmd" in
  -h|--help|help) usage; exit 0 ;;
  status)
    echo "== Signing status =="
    cat "$ROOT/tizen/release/SIGNING_STATUS.txt" 2>/dev/null || echo "(none)"
    echo "== sdb devices =="
    sdb devices
    exit 0
    ;;
esac

need_ip

case "$cmd" in
  connect)
    echo "==> sdb connect ${TV_IP}:${PORT}"
    sdb connect "${TV_IP}:${PORT}"
    sdb devices
    ;;
  devices)
    sdb devices
    ;;
  duid)
    sdb connect "${TV_IP}:${PORT}" || true
    echo "==> DUID (copy into Certificate Manager → Distributor)"
    sdb shell 0 getduid || sdb -s "${TV_IP}:${PORT}" shell 0 getduid
    ;;
  install)
    need_signed
    sdb connect "${TV_IP}:${PORT}"
    echo "==> Installing $WGT_SIGNED"
    # tizen install expects the .wgt name and project path context
    tizen install -n "$WGT_SIGNED" -- "$ROOT/tizen/ChulaOS"
    ;;
  launch)
    sdb connect "${TV_IP}:${PORT}"
    echo "==> Launching $APP_ID"
    tizen run -p "$APP_ID" || sdb shell 0 was_execute "$APP_ID"
    ;;
  all)
    need_signed
    sdb connect "${TV_IP}:${PORT}"
    sdb devices
    echo "==> DUID (for certs if not already added)"
    sdb shell 0 getduid || true
    echo "==> Installing"
    tizen install -n "$WGT_SIGNED" -- "$ROOT/tizen/ChulaOS"
    echo "==> Launching $APP_ID"
    tizen run -p "$APP_ID" || true
    echo "Done. Complete on-device checks in docs/tizen/VERIFY_ON_DEVICE.md"
    ;;
  *)
    usage
    exit 1
    ;;
esac
