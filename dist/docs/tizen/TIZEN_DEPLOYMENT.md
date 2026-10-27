# Chula OS — Samsung Tizen TV Deployment

**TV target:** Samsung Crystal UHD **U6000F**  
**Platform (from Samsung model groups):** 2025 BASIC lineup → **Tizen 9.0** (TV Extension **9.0 or higher**)  
**App type:** Tizen TV **Web Application** (`.wgt`) wrapping Chula OS 1.0.0  
**App ID:** `ChulaKenya.ChulaOS`

## Environment check (this Mac — verified 2026-10-27)

| Requirement | Status on this Mac |
|-------------|--------------------|
| Tizen Studio IDE | **Not installed** |
| `tizen` CLI | **Not found** |
| `sdb` | **Not found** |
| Samsung TV Extensions 9.0 | **Not installed** |
| Samsung Certificate Extension | **Not installed** |
| Java runtime | **Not installed** (`java_home` empty) |
| Project wrapper `tizen/ChulaOS` | **Created** |
| Unsigned structural `.wgt` | **Created** (not installable) |
| Signed `.wgt` | **Not created** — blocked by missing SDK/certs |

## What was implemented without the TV

1. `tizen/ChulaOS/` — full web app tree + `config.xml` + icons  
2. `js/tizen-bridge.js` — remote extras, ApplicationControl launches, network/model helpers  
3. Back key (`10009`) / Exit (`10182`) handling with double-Back to exit  
4. Streaming launch path: try known native IDs → `ApplicationControl` VIEW URL → graceful error  
5. Service worker **disabled** inside the Tizen package (PWA SW remains for browser build)  
6. Sync + package scripts  
7. Connection / certificate / install checklist (below)

## Preserve PWA

The browser/PWA build in project root and `dist/` remains intact. Tizen is an additional target under `tizen/`.

## Build commands

```bash
cd "/Applications/Chula Os"

# Keep web build healthy
./scripts/validate.sh
./scripts/build.sh

# Sync UI into Tizen project
./scripts/sync-tizen.sh

# Package (.wgt signed if CLI+profile exist; else UNSIGNED placeholder)
./scripts/package-tizen.sh
```

Artifacts:

- `tizen/ChulaOS/` — source project to open in Tizen Studio  
- `tizen/release/SIGNING_STATUS.txt` — signing result  
- `tizen/release/chula-os-1.0.0-tizen-UNSIGNED.wgt` — **structure only**, will **not** install on retail TV  

## Install Tizen Studio on this Mac (required for a real .wgt)

1. Install a JDK (Temurin 17+ recommended):  
   `brew install --cask temurin`
2. Download **Tizen Studio** from [Samsung Developers — Installing TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)
3. In **Package Manager**, install:
   - TV Extensions **9.0** (or higher)
   - Samsung Certificate Extension
   - TV Emulator images (optional but useful)
4. Confirm CLI:
   ```bash
   # typical path — adjust to your install location
   export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"
   tizen version
   sdb version
   ```

## Certificates (required to install on the U6000F)

1. Open **Certificate Manager** in Tizen Studio  
2. Create a **Samsung** certificate profile (Author + Distributor)  
3. For device testing, create a **distributor certificate tied to your TV’s DUID**  
4. Note the profile name (example: `ChulaProfile`)

Then:

```bash
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"
export TIZEN_SECURITY_PROFILE=ChulaProfile
./scripts/package-tizen.sh
```

## Connect the U6000F

1. TV and Mac on the **same network**  
2. On the TV: **Settings → General / System → Developer** (exact path varies)  
   - Enable **Developer mode**  
   - Enter your Mac’s IP when prompted  
3. Power-cycle the TV if required  
4. On the Mac:
   ```bash
   sdb connect <TV_IP>
   sdb devices
   ```
5. In Certificate Manager, refresh devices and add the TV DUID to the distributor cert if needed; re-sign.

## Install & launch

```bash
sdb connect <TV_IP>
tizen install -n tizen/release/chula-os-1.0.0-tizen-signed.wgt -- tizen/ChulaOS
# or from Tizen Studio: Run As → Tizen Web Application on the device
```

Open **Chula OS** from the TV Apps / Downloaded apps list.

## Startup / Smart Hub reality (verified policy)

| Claim | Status |
|-------|--------|
| Install Chula OS as a normal TV app | Supported (with signed `.wgt`) |
| Appear in Apps / Home after install | Supported |
| “Last used app” may resume Chula OS after some power cycles | **Vendor behavior** — depends on TV settings; not controlled by this package |
| Replace Smart Hub / intercept system Home permanently | **Not supported / not claimed** |
| Flash firmware / root / disable security | **Out of scope — do not do this** |

Samsung does not provide a public, supported API for third-party apps to permanently replace Smart Hub on retail Tizen TVs. Chula OS is designed as an installed launcher app you open from Apps.

## Remote mapping

| Samsung remote | Chula OS |
|----------------|----------|
| ←↑↓→ | Focus move |
| Enter / OK | Select |
| Back | Previous view; on home, press twice to exit |
| Long Back / Exit | Exit app |
| Colored keys | Registered for future use (no required actions) |

## Streaming launches on Tizen

1. Best effort: launch a known native app ID (YouTube/Netflix where IDs match firmware)  
2. Else: `ApplicationControl` `view` with the official HTTPS URL  
3. Else: on-screen error — open the official app from Smart Hub  

DRM/login still happen inside the vendor app or site. Chula OS does not bypass subscriptions.

## Remaining hardware-dependent steps (your checklist)

- [ ] Install JDK + Tizen Studio + TV Extensions 9.0 + Certificate Extension  
- [ ] Create Samsung certificate profile + distributor cert with TV DUID  
- [ ] Enable Developer Mode on the U6000F  
- [ ] `sdb connect` and confirm device  
- [ ] Run `./scripts/package-tizen.sh` to produce a **signed** `.wgt`  
- [ ] `tizen install` / Studio deploy  
- [ ] On-device test: boot animation, focus, Back, each tile launch, Settings, offline  
- [ ] Optional: pin Chula OS in Apps for faster access (TV UI feature)  

## References

- [Installing TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)  
- [TV Model Groups](https://developer.samsung.com/smarttv/develop/specifications/tv-model-groups.html)  
- [Configuring TV applications](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html)  
- [Remote control / TVInputDevice](https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html)  
