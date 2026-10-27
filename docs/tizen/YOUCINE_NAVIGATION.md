# YouCine navigation notes (Chula OS)

**Status:** **Not added** to the launcher. Requested start URL could not be verified as a real service.

**Requested URL:** `https://youcine.tv/`  
**Inspection date (UTC):** 2026-10-27  

## Safe inspection (no APK download)

| Check | Result |
|-------|--------|
| DNS `youcine.tv` | Resolves (e.g. `91.195.240.94`) |
| `https://youcine.tv/` | **TLS handshake fails** — `tlsv1 unrecognized name` (no usable certificate for this hostname from this host) |
| `http://youcine.tv/` | **`405 Not Allowed`**, `server: Parking/1.0` |
| HTTP(S) redirect to a real app site | **None observed** — parking/placeholder behavior |
| Final domain after redirects | N/A (HTTPS incomplete; HTTP parking) |

**Lookalike domains** (`youcine.com`, `youcinetv.com`, `youcine.net`, etc.) were **not** substituted. Per project rules, a similarly named site must not silently replace `youcine.tv`.

## Downloads / APK research (updated)

Follow-up APK hunt (see `research/youcine/FINDINGS.md`):

- Former “oficial” domain `ycoficial.net` → **parking / unreachable** — not a download source.
- Marketing site `www.youcine.net/baixar/` links APKs on **`*.playtro.click`** third-party hosts — **not downloaded** (identity/authorization not reasonably verified).
- Reported package `com.world.youcinemobile` is **not** on Google Play.
- Multiple Play apps with similar names are **different** products — not substituted.

**No APK was downloaded.** No SHA-256. An Android APK would **not** run on Samsung Tizen and must never be renamed to `.wgt`.

## Launcher decision

- **No** YouCine registry tile (would be misleading).
- Existing **Cinejoy** caution entry and all other tiles **unchanged**.
- Certificates, app ID `ChulaKenya.ChulaOS`, and signing profile **unchanged**.

## Distinctions

| Kind | YouCine status |
|------|----------------|
| Website shortcut in Chula OS | **Not created** (domain unverified) |
| Installed native Tizen/Android app | **Not applicable** |

## Blocker (needs your input)

Provide a **working, intentional** official URL or package identity for YouCine (not a parking page), or confirm a different exact domain if `youcine.tv` was mistyped. Then a caution External entry can be added using the same confirm dialog as Cinejoy.
