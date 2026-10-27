# Cinejoy navigation notes (Chula OS)

**Status:** Optional **caution** external HTTPS entry only. **Not** labeled safe or trusted.  
**No TV deploy** was performed for this investigation.

## Safe inspection (2026-10-27)

Non-invasive checks only (DNS, HTTPS headers, ≤8 KB HTML sample). No APK/binary download or execution.

| Check | Result |
|-------|--------|
| `https://cinejoy.pk/` | HTTP/2 **200**, **0** server redirects (`num_redirects: 0`) |
| Final URL | Stays on `https://cinejoy.pk/` |
| `X-Frame-Options` | **DENY** (+ `frame-ancestors 'none'`) — **cannot** embed in Chula OS |
| Protection | `server: ddos-guard` |
| Client scripts | Third-party host `a.wing.st` (ad-related loader when local preference allows) |
| `window.location` in sample | Used for **reload** on Vite preload error — not an HTTP Location hop |
| Content-Type | `text/html` (no forced APK disposition in this sample) |

**First-click “redirect” behavior:** Not observed as an HTTP 3xx chain from this probe. In-browser navigation to other domains (ads, interstitial scripts) can still occur **after** JavaScript runs in the TV browser. Chula OS **cannot** see or stop those navigations once control leaves the `.wgt`.

Security scanners may flag `cinejoy.pk` as potentially harmful. That assessment is **not** contradicted here.

## What Chula OS can and cannot do on Tizen

| Capability | Supported? |
|------------|------------|
| Open `https://cinejoy.pk/` via `ApplicationControl` VIEW / browser | Yes (user-confirmed) |
| Keep Cinejoy out of trusted/native matching | Yes (`trust: "caution"`) |
| Confirm before leave (default = stay) | Yes |
| Embed site in an iframe inside Chula | **No** (`X-Frame-Options: DENY`) |
| Detect/block in-browser redirects or ads | **No** on retail Tizen after handoff |
| Suppress browser warnings / auto-accept downloads | **Not implemented** (forbidden) |
| Automatic Back loops to defeat ads | **Not implemented** (forbidden) |

Return path: existing `chulaos.return` + Back / Apps → Chula OS (same as other externals). `background-support` remains **disable**.

## Registry placement

- **All Apps** → category **External**, badge **Caution**
- **Not** on the home row of trusted tiles
- Opens only after **Continue anyway**; **Stay in Chula OS** / Back cancels
