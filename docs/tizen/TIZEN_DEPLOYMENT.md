# Chula OS — Samsung Tizen TV Deployment

**TV target:** Samsung Crystal UHD **U6000F**  
**Platform (from Samsung model groups):** 2025 BASIC lineup → **Tizen 9.0** (TV Extension **9.0 or higher**)  
**App type:** Tizen TV **Web Application** (`.wgt`) wrapping Chula OS 1.0.0  
**App ID:** `ChulaKenya.ChulaOS`  
**Package ID:** `ChulaKenya` (10 alphanumeric characters)

## Environment check

Run anytime from the repository root (read-only, installs nothing):

```bash
./scripts/check-tizen-sdk.sh
```

| Requirement | Official note | In this repository |
|-------------|---------------|--------------------|
| OS | 64-bit macOS (docs list 11.4 / 12.3; newer usually OK) | Re-check the host with the script above |
| RAM / disk | ≥ 3 GB RAM, ≥ 6 GB free | Host check when the probe runs |
| Tizen Studio IDE | Download installer; prefer install under **`$HOME`** on Mac | **Not vendored** |
| JDK | **Not required** for Tizen Studio **3.7+** (JDK bundled). Older Studio needed JDK 8 / OpenJDK 12 | Separate JDK only for older Studio |
| TV Extensions | **9.0 or higher** (10.0 also ships a macOS image; usable for 9.0 TVs) | **Not vendored** |
| Samsung Certificate Extension | Required; versions **&lt; 2.0.73 cannot create certs after Sept 2025** | **Not vendored** |
| Homebrew | Optional helper for a system JDK only | Optional |
| `tizen` / `sdb` | From `$HOME/tizen-studio/tools` | Expected on PATH after Studio is installed |
| Project `tizen/ChulaOS` | — | **Present** (check with `verify-tizen-project.sh`) |
| Signed `.wgt` | Needs CLI + Samsung security profile | **Not stored in git.** `package-tizen.sh` writes it under `tizen/release/` |
| Unsigned structural `.wgt` | Inspection only | Created only with `ALLOW_UNSIGNED=1`. **Not stored in git** |
| TV IP and DUID | Needed only to create a distributor certificate for a specific set | **Not stored in git** |

**Nothing in this repo installs system software.** Approvals you must give yourself: Tizen Studio installer, Package Manager extensions, macOS prompts, Samsung account login for certificates, TV Developer Mode.

---

## What was automated without the TV

1. `tizen/ChulaOS/` — web app + `config.xml` + icons + IDE `.project` / `.tproject`  
2. `js/tizen-bridge.js` — remote extras, ApplicationControl launches, network/model helpers  
3. Back (`10009`) / Exit (`10182`) with double-Back exit on home  
4. Streaming: native IDs (best effort) → AppControl VIEW → graceful error  
5. Service worker **not** in Tizen package; SW registration lives in `main.js` and skips Tizen (CSP-safe, no inline scripts)  
6. `sync-tizen.sh` / `verify-tizen-project.sh` / `package-tizen.sh` / `check-tizen-sdk.sh` / `deploy-tizen.sh`  
7. Certificate, DUID, SDB, and on-device verification docs  

## Preserve PWA

Browser/PWA build in project root and `dist/` stays intact. Tizen is an additional target under `tizen/`.

Launcher capabilities (supported vs Smart Hub / Home limits): see [`LAUNCHER_CAPABILITIES.md`](./LAUNCHER_CAPABILITIES.md).  
Reezn / R Player research (no TV deploy; integration blocked pending official source): [`REEZN_INTEGRATION.md`](./REEZN_INTEGRATION.md).  
Cinejoy optional caution navigation: [`CINEJOY_NAVIGATION.md`](./CINEJOY_NAVIGATION.md).  
YouCine (`youcine.tv`) — not added; parking/TLS failure: [`YOUCINE_NAVIGATION.md`](./YOUCINE_NAVIGATION.md).

---

## Build / package commands

```bash
# from the repository root
./scripts/validate.sh
./scripts/build.sh
./scripts/sync-tizen.sh
./scripts/verify-tizen-project.sh

# Signed package ONLY (fails clearly if CLI or profile missing)
TIZEN_SECURITY_PROFILE=ChulaProfile ./scripts/package-tizen.sh

# Optional structural zip for inspection — still exits non-zero
ALLOW_UNSIGNED=1 ./scripts/package-tizen.sh
```

Artifacts:

| Path | Meaning |
|------|---------|
| `tizen/ChulaOS/` | Open in Tizen Studio. Web assets are refreshed by `sync-tizen.sh` |
| `tizen/release/SIGNING_STATUS.txt` | Local result: `STATUS=SIGNED` or `UNSIGNED`. Gitignored |
| `tizen/release/chula-os-1.0.0-tizen-signed.wgt` | Local signed package when packaging succeeds. Gitignored |
| `…-UNSIGNED.wgt` | Structure only — **will not install** on a retail TV. Gitignored |

---

## Setup checklist (install only after you approve)

### A. Optional: Homebrew + system JDK

Only needed if you install an **old** Tizen Studio (&lt; 3.7). For current Studio, **skip**.

1. Install Homebrew from https://brew.sh (requires your password).  
2. `brew install --cask temurin`  
3. Confirm: `/usr/libexec/java_home -V`

### B. Tizen Studio (required)

1. Download macOS installer from [Tizen Studio download](https://developer.tizen.org/development/tizen-studio/download) (linked from [Installing TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)).  
2. Run the installer. **Install location: `$HOME/tizen-studio`** (Samsung notes Mac Java errors if not under home).  
3. Accept licenses. Finish with **Launch Package Manager** checked.

### C. Extensions (required for U6000F)

In Package Manager → **Extension SDK**:

1. Install **TV Extensions-9.0** (or **10.0** / higher — supports packaging for Tizen 9 TVs).  
2. Install **Samsung Certificate Extension** (**≥ 2.0.73**).  
3. Optional: TV Emulator image for smoke tests without the panel.

Offline images: [TV Extension download](https://developer.samsung.com/smarttv/develop/tools/tv-extension/download.html).

### D. PATH (shell profile)

```bash
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"
tizen version
sdb version
./scripts/check-tizen-sdk.sh
```

---

## Author + Distributor certificate workflow

Retail U6000F apps must be signed with a **Samsung** certificate profile (not a plain Tizen profile).

### 1. Samsung account

You need a [Samsung account](https://account.samsung.com/) — Certificate Manager signs author/distributor certs against Samsung’s servers.

### 2. Create profile

1. Open **Certificate Manager** (Tizen Studio → Tools, or standalone).  
2. **+** → profile name e.g. `ChulaProfile`.  
3. Device type: **Samsung** (TV).  

### 3. Author certificate

1. Create new author certificate (name, org, email, strong password).  
2. Sign in with Samsung account when prompted.  
3. Saves under `~/SamsungCertificate/<profile>/author.p12` (typical).

### 4. Obtain the TV DUID (before finishing Distributor)

1. Enable Developer Mode on the TV (section below).  
2. Connect from Mac:

```bash
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"
sdb connect <TV_IP>:26101
sdb devices
sdb shell 0 getduid
```

3. Or: Device Manager → connected TV → context menu → **DUID**.  
4. Copy the DUID string exactly.

### 5. Distributor certificate

1. In the same profile, create **Distributor** certificate.  
2. Privilege for personal/dev sideload on consumer TV: **Public** (Partner is for commercial/signage / store privilege levels).  
3. Add the U6000F **DUID** (auto-fill if device connected). Multiple DUIDs allowed.  
4. Samsung account login again.  
5. Saves `distributor.p12` next to the author cert.

### 6. Use the profile when packaging

```bash
export TIZEN_SECURITY_PROFILE=ChulaProfile
./scripts/package-tizen.sh
# Expect: tizen/release/SIGNING_STATUS.txt → STATUS=SIGNED
```

If you change DUIDs later, regenerate the distributor cert and **re-sign** the `.wgt`.

---

## Enable Developer Mode on the U6000F

1. Mac and TV on the **same Wi‑Fi / LAN**.  
2. On the TV remote, open **Apps** (Smart Hub apps screen).  
3. Enter **`12345`** on the remote — Developer Mode panel appears.  
4. Set Developer Mode **On**.  
5. Enter your **Mac’s IP address**.  
6. Power-cycle the TV (hold power ~2s or unplug).  
7. Note the TV’s IP (Network settings).

---

## SDB connect / install / launch (exact commands)

```bash
# from the repository root
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"

# Replace with the TV address
export TIZEN_TV_IP=192.168.1.50

sdb connect ${TIZEN_TV_IP}:26101
sdb devices
sdb shell 0 getduid

# After signed package exists:
./scripts/deploy-tizen.sh ${TIZEN_TV_IP} install
./scripts/deploy-tizen.sh ${TIZEN_TV_IP} launch

# Or one shot:
./scripts/deploy-tizen.sh ${TIZEN_TV_IP} all
```

Manual equivalents:

```bash
tizen install -n tizen/release/chula-os-1.0.0-tizen-signed.wgt -- tizen/ChulaOS
tizen run -p ChulaKenya.ChulaOS
```

Open **Chula OS** from Apps if launch CLI fails but install succeeds.

---

## Startup / Smart Hub reality

| Claim | Status |
|-------|--------|
| Install as a normal TV app | Supported with signed `.wgt` |
| Appear in Apps after install | Supported |
| “Last used app” may resume after some power cycles | Vendor behavior — not controlled by this package |
| Replace Smart Hub / intercept system Home | **Not supported — not claimed** |
| Flash firmware / root / disable security | **Out of scope** |

---

## Remote mapping

| Samsung remote | Chula OS |
|----------------|----------|
| ←↑↓→ | Focus move |
| Enter / OK | Select |
| Back | Previous view; on home, twice to exit |
| Long Back / Exit | Exit app |
| Colored keys | Registered; no required actions |

## Streaming launches

1. Known native app IDs (YouTube/Netflix where firmware matches)  
2. Else `ApplicationControl` `view` + official HTTPS URL  
3. Else on-screen error — use official Smart Hub app  

DRM/login stay inside the vendor app. No subscription bypass.

On-device checklist: [`VERIFY_ON_DEVICE.md`](./VERIFY_ON_DEVICE.md).

---

## Remaining steps that require you / the TV

- [ ] Approve & install Tizen Studio under `$HOME`  
- [ ] Install TV Extensions 9.0+ + Certificate Extension ≥ 2.0.73  
- [ ] Samsung account + Author/Distributor certs with U6000F DUID  
- [ ] Developer Mode + Mac IP on the TV; power-cycle  
- [ ] `TIZEN_SECURITY_PROFILE=… ./scripts/package-tizen.sh` → **SIGNED**  
- [ ] `./scripts/deploy-tizen.sh <TV_IP> all`  
- [ ] Complete [`VERIFY_ON_DEVICE.md`](./VERIFY_ON_DEVICE.md)  

## References

- [Installing TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)  
- [Tizen Studio prerequisites](https://developer.tizen.org/development/tizen-studio/download/prerequisites)  
- [TV Extension download](https://developer.samsung.com/smarttv/develop/tools/tv-extension/download.html)  
- [TV Model Groups](https://developer.samsung.com/smarttv/develop/specifications/tv-model-groups.html)  
- [Configuring TV applications](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html)  
- [Remote control](https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html)  
