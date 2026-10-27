#!/usr/bin/env python3
"""Static validation for Chula OS production launcher."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def fail(msg: str) -> None:
    errors.append(msg)


def main() -> int:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        fail(f"VERSION invalid: {version!r}")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    for needle in (
        "EXPERIENCE CHULA OS",
        "Proudly made in Kenya",
        'id="home"',
        'id="entertainment"',
        'id="library"',
        'id="settings"',
        "js/main.js",
        "js/entertainment.js",
        "js/tizen-bridge.js",
        "manifest.webmanifest",
    ):
        if needle not in html:
            fail(f"index.html missing {needle!r}")

    cfg = ROOT / "tizen/ChulaOS/config.xml"
    if not cfg.exists():
        fail("missing tizen/ChulaOS/config.xml")
    else:
        cfg_text = cfg.read_text(encoding="utf-8")
        for needle in (
            "ChulaKenya.ChulaOS",
            "http://tizen.org/privilege/tv.inputdevice",
            "http://tizen.org/privilege/application.launch",
            'profile name="tv-samsung"',
        ):
            if needle not in cfg_text:
                fail(f"config.xml missing {needle!r}")

    # Home must not permanently brand after boot markup section
    home = html.split('id="home"', 1)[1].split('id="entertainment"', 1)[0]
    if re.search(r"Chula\s*OS", home):
        fail("Home markup contains Chula OS branding")

    registry = (ROOT / "js/registry.js").read_text(encoding="utf-8")
    for app_id in (
        "entertainment",
        "stremio",
        "youtube",
        "netflix",
        "disney",
        "prime",
        "appletv",
        "plex",
        "dstv",
        "iptv",
        "allapps",
        "cinejoy",
    ):
        if f'id: "{app_id}"' not in registry:
            fail(f"registry missing app {app_id}")

    if "youcine" in registry.lower() and 'id: "youcine"' in registry:
        fail("registry must not include YouCine tile")

    for url in (
        "https://web.stremio.com/",
        "https://www.youtube.com/tv",
        "https://www.netflix.com/",
        "https://www.disneyplus.com/",
        "https://www.primevideo.com/",
        "https://tv.apple.com/",
        "https://www.plex.tv/",
        "https://www.dstv.com/en-ke/",
        "https://cinejoy.pk/",
    ):
        if url not in registry:
            fail(f"registry missing official URL {url}")

    for cat in ("Movies & TV", "Football & Sports", "External Websites"):
        if cat not in registry:
            fail(f"registry missing Entertainment category {cat!r}")

    if 'trust: "caution"' not in registry:
        fail("registry missing caution trust for external sites")

    manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
    if manifest.get("name") != "Chula OS":
        fail("manifest name mismatch")
    if manifest.get("display") not in {"fullscreen", "standalone", "minimal-ui"}:
        fail("manifest display unsuitable for TV")

    # Ensure no hardcoded secrets
    for path in (ROOT / "js").glob("*.js"):
        text = path.read_text(encoding="utf-8")
        if re.search(r"(api[_-]?key|secret|password)\s*[:=]\s*['\"][^'\"]+['\"]", text, re.I):
            fail(f"possible secret in {path.name}")

    wallpaper = ROOT / "assets/wallpaper.jpg"
    if wallpaper.stat().st_size < 200_000:
        fail("wallpaper.jpg unexpectedly small")

    if errors:
        print("TEST FAILURES:")
        for e in errors:
            print(" -", e)
        return 1

    print("tests/validate.py OK")
    print("version", version)
    return 0


if __name__ == "__main__":
    sys.exit(main())
