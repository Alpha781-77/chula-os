# Entertainment hub (Chula OS)

**Scope:** In-app Entertainment section. No TV deploy required for this document.

## Navigation

Home (decluttered) → **Entertainment** tile → hub with three sections:

1. **Movies & TV** — YouTube, Netflix, Disney+, Prime Video, Apple TV, Stremio, Plex  
2. **Football & Sports** — DStv Stream (official DStv Kenya site)  
3. **External Websites** — Cinejoy (caution + confirm)

Also reachable from **All Apps** via the same registry categories. **YouCine** is not listed (no authorized Tizen integration).

## Launch policy

| Service | Native | HTTPS fallback | Notes |
|---------|--------|----------------|-------|
| YouTube | Alias `9Ur5IzDKqV.TizenYouTube` **only if installed**; name match | `https://www.youtube.com/tv` | Existing discovery path |
| Netflix / Disney+ / Prime / Apple TV | Name match (+ Netflix alias if installed) | Official vendor HTTPS | Unchanged policy |
| Stremio | — | `https://web.stremio.com/` | Official web app |
| Plex | Exact name match if installed | `https://www.plex.tv/` | Website **≠** full Samsung TV app |
| DStv Stream | Name match: DStv / DStv Stream / SuperSport if installed | `https://www.dstv.com/en-ke/` | Browser does **not** promise live SuperSport |
| Cinejoy | Never (caution) | `https://cinejoy.pk/` after confirm | See `CINEJOY_NAVIGATION.md` |

Launcher behavior is unchanged: prefer resolved installed app IDs, then `ApplicationControl` VIEW / browser; caution never uses native matching; no auto-launch, no ad Back loops, no DRM bypass.

## Device verification still required

On a physical Samsung TV, confirm with `getAppsInfo()` / tile launch:

- YouTube / Plex / DStv native IDs actually present for your region/firmware  
- Return-to-Chula after external handoff  
- Caution dialog for Cinejoy  

Hardcoded Tizen IDs remain **aliases only** until confirmed on device.

## Packaging

App ID `ChulaKenya.ChulaOS` and signing profile are unchanged. Sync via `./scripts/sync-tizen.sh` before packaging.
