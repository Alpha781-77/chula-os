# Chula OS launcher capabilities on Samsung retail Tizen

**Target:** Samsung Crystal UHD / U8000F-class TVs running **Tizen 9.0** (and similar).  
**App ID:** `ChulaKenya.ChulaOS` — normal sideloaded / installed `.wgt`, not a system shell.

## Supported (this project)

| Capability | How |
|------------|-----|
| Discover installed apps | `tizen.application.getAppsInfo()` with privilege `application.info` |
| Launch installed apps by ID | `tizen.application.launch(appId)` after resolving an installed ID |
| Match registry tiles to TV apps | Exact installed ID, **alias only if installed**, then safe exact name match |
| HTTPS / browser fallback | `ApplicationControl` `view` with official HTTPS URLs |
| In-app Home | Library / Settings **← Home** and Back / Esc return to Chula Home |
| Soft resume | `visibilitychange` / `pageshow` restore Home when `chulaos.return` is set — **does not** re-open the external app |
| Double-Back exit | On Home, Back twice (or Exit) calls `application.exit()` |

## Unsupported on retail firmware (do not expect)

| Claim | Reality |
|-------|---------|
| Replace Samsung Smart Hub | **Not available** to third-party apps |
| Intercept the physical **Home** button | **Not available** — Home still opens Smart Hub |
| Force Chula OS on every TV cold boot as the system launcher | **Not available** without vendor / custom firmware |
| Root, flash, or modify protected partitions | **Out of scope** — never attempted by this project |

## Background support trade-off

`config.xml` sets `background-support="disable"` on purpose:

- **Pro:** Process exits cleanly when leaving; fewer surprise background behaviors.
- **Con:** Returning to Chula after another app often means reopening it from **Apps**, unless the TV still has the process in memory.

Changing this to `enable` requires a **separate, justified on-device test** — not flipped casually.

## How to return to Chula OS after another app

1. Press the TV **Apps** (or Smart Hub apps list) and open **Chula OS** again, or  
2. If the process was kept alive, use the remote **Back** stack until Chula resumes (behavior varies by firmware).

There is no supported API to steal focus from Smart Hub permanently.

## Aliases vs confirmed IDs

Hardcoded Tizen application IDs in the registry are labeled **aliases/fallbacks**. They are used **only** when `getAppsInfo()` reports that exact ID as installed. Name matching is exact (normalized), not fuzzy substring matching.
