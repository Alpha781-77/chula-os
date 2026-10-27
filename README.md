# Chula OS

[![Validate](https://github.com/Alpha781-77/chula-os/actions/workflows/validate.yml/badge.svg)](https://github.com/Alpha781-77/chula-os/actions/workflows/validate.yml)

**Version 1.0.0** — a remote-friendly Smart TV home launcher for the browser and for Samsung Tizen.  
Proudly made in Kenya.

Chula OS gives a television a single, D-pad-navigable home for official streaming destinations, a user-supplied IPTV page, and the apps already installed on a Samsung TV. Preferences stay on the device. It does **not** replace Samsung Smart Hub, LG webOS, Android TV, or television firmware, and it does not ship proprietary apps, playlists, or DRM bypasses.

## Problem

Smart TV home screens are built around each vendor’s store. Moving between a few legitimate services, a personal IPTV player page, and apps already on the set usually means leaving one vendor UI for another. Chula OS is a small launcher you can open in a TV browser, install as a progressive web app, or package as a normal Samsung Tizen web application.

## Features

- **Launcher home** — clock, greeting, network badge, and tiles for Entertainment, IPTV, All Apps, and Settings. Boot branding is not repeated on the home screen.
- **Entertainment Hub** — Movies & TV (YouTube, Netflix, Disney+, Prime Video, Apple TV, Stremio, Plex), Football & Sports (DStv Stream via the official Kenya site), and External Websites (Cinejoy, behind a confirmation).
- **IPTV entry** — opens an HTTPS player URL the viewer configures. No playlists or streams are bundled.
- **All Apps** — search, categories, recents, and favorites over the same registry.
- **Application discovery** — on Tizen, installed apps are read with `tizen.application.getAppsInfo()`. A tile uses an exact installed id, an alias only when that id is installed, then an exact name match. Otherwise it opens the official HTTPS page through `ApplicationControl`, or shows an in-app error.
- **Tizen integration** — `tizen/ChulaOS/` is a `tv-samsung` web widget (`ChulaKenya.ChulaOS`) with remote Back/Exit handling. The service worker is omitted from the widget because the package content-security policy allows only packaged scripts.

Streaming sites open at their official HTTPS origins. Accounts and playback rights stay with those services.

## Screenshots

Genuine screenshots are not in this repository yet. Replace each row only with a capture from a real browser session or a Samsung TV.

| Screen | File | Status |
|--------|------|--------|
| Home | `docs/screenshots/home.png` | Placeholder — not captured |
| Entertainment Hub | `docs/screenshots/entertainment.png` | Placeholder — not captured |
| All Apps | `docs/screenshots/all-apps.png` | Placeholder — not captured |
| Settings | `docs/screenshots/settings.png` | Placeholder — not captured |

## Technology

| Layer | Choice |
|-------|--------|
| UI | HTML and CSS, no framework |
| Behavior | Vanilla JavaScript IIFEs on one `ChulaOS` namespace |
| Persistence | `localStorage` for launcher preferences |
| Web install | `manifest.webmanifest` and `sw.js` (browser/PWA only) |
| TV package | Samsung Tizen web application, profile `tv-samsung`, platform `tv-samsung-9.0` |
| Tests | Static checks in `scripts/validate.sh`, `tests/validate.py`, and `scripts/verify-tizen-project.sh` |

There is no bundler and no third-party application runtime.

## Architecture

The repository root is the canonical web app. `scripts/sync-tizen.sh` copies those web files into `tizen/ChulaOS/` and leaves `config.xml`, icons, and the Tizen Studio project files in place. `scripts/build.sh` copies the web app into `dist/` for hosting. Generated output is not committed. See [What is versioned](#what-is-versioned).

```
index.html
├── js/config.js          constants
├── js/storage.js         on-device preferences
├── js/registry.js        app catalog and official URLs
├── js/tizen-bridge.js    Tizen remote, discovery, and launch helpers
├── js/ui.js              focus, toasts, escape
├── js/launcher.js        URL checks and launch policy
├── js/router.js          boot, home, entertainment, library, settings
├── js/boot.js            boot sequence
├── js/home.js            home
├── js/entertainment.js   Entertainment Hub
├── js/library.js         All Apps
├── js/settings.js        settings
└── js/main.js            startup, keys, service worker (skipped on Tizen)
```

Launch order for a streaming tile:

1. Resolve an installed Tizen application id (exact id, then alias only if installed, then exact display name).
2. Otherwise open the registry’s official HTTPS URL with `ApplicationControl` `view` (or a normal navigation in the browser build).
3. Otherwise stay in Chula OS and show an error.

Caution entries never use native app matching. URLs must be `http:` or `https:` and must not carry embedded credentials.

## Project layout

```
├── index.html
├── styles.css
├── styles-app.css
├── js/
├── assets/                 wallpaper and self-hosted Space Grotesk
├── icons/
├── manifest.webmanifest
├── sw.js
├── scripts/                validate, build, sync, package, SDK probe
├── tests/validate.py
├── docs/
├── tizen/ChulaOS/          Tizen Studio project (source)
└── VERSION
```

## Local development

From a clone of this repository:

```bash
./scripts/validate.sh
python3 -m http.server 8765
```

Open [http://localhost:8765/](http://localhost:8765/). Fullscreen is closer to a TV. Add `?boot=1` to replay the boot sequence.

| Input | Action |
|-------|--------|
| Arrow keys | Move focus |
| Enter / Space | Select |
| Esc / Backspace | Back |
| Home | Return to home where the browser allows it |
| F (in All Apps) | Toggle favorite |
| Ctrl/Cmd+Shift+R | Replay boot |

## Validation, build, and packaging

```bash
./scripts/validate.sh
./scripts/build.sh
./scripts/sync-tizen.sh
./scripts/verify-tizen-project.sh
./scripts/check-tizen-sdk.sh
```

| Command | Result |
|---------|--------|
| `validate.sh` | Required files, JavaScript syntax, and `tests/validate.py`. Uses `node --check` when Node.js is installed, otherwise a brace-balance fallback |
| `build.sh` | `dist/` and `dist/chula-os-1.0.0-web.zip` |
| `sync-tizen.sh` | Refreshes web files inside `tizen/ChulaOS/` |
| `verify-tizen-project.sh` | Offline structure, privileges, CSP, and remote key codes |
| `check-tizen-sdk.sh` | Reports whether Tizen Studio is installed. Installs nothing |
| `package-tizen.sh` | Signed `.wgt` when `tizen` and a Samsung security profile exist. Exits non-zero otherwise |
| `ALLOW_UNSIGNED=1 ./scripts/package-tizen.sh` | Also writes a structural unsigned widget, and still exits non-zero |
| `deploy-tizen.sh` | Connects to a TV you name. Not part of validation |

Host the web build from `dist/` (`python3 -m http.server 8765` inside that directory) or copy it to any static host the TV can reach. Installation notes: [docs/INSTALL.md](docs/INSTALL.md). Tizen setup: [docs/tizen/TIZEN_DEPLOYMENT.md](docs/tizen/TIZEN_DEPLOYMENT.md).

GitHub Actions runs `validate.sh` (with Node.js), `verify-tizen-project.sh`, and `build.sh` on pushes and pull requests to `main`. That workflow does not sign a package, connect to a television, or read certificates. See [Contributing](CONTRIBUTING.md).

## Samsung Tizen compatibility and limitations

Design target: Samsung Tizen TV web apps on **Tizen 9.0** (`tv-samsung-9.0` in `tizen/ChulaOS/.tproject`), documented against the Crystal UHD **U6000F** class. `config.xml` sets `required_version` to 6.0 so older Tizen TV profiles that accept the package can still install it. That is a packaging floor, not a claim that every older set has been tried.

| Target | Support |
|--------|---------|
| Desktop browser | Supported for development |
| Smart TV or set-top browser, and PWA where the browser allows install | Supported from `dist/` |
| Samsung Tizen TV web app | Project, bridge, and package scripts included |
| Android TV APK | Not shipped |
| Replacing Smart Hub or intercepting the system Home key | Not available to a third-party widget |
| Custom firmware | Not supported |

`background-support` is `disable`. Leaving Chula OS for another app can end the process. Coming back is normally done by opening Chula OS again from the TV’s Apps list. Changing that setting needs a separate on-device test.

Native application ids in the registry are aliases. They are used only after `getAppsInfo()` reports that id as installed. They are not treated as confirmed until someone records that result on a set.

Further limits: [docs/tizen/LAUNCHER_CAPABILITIES.md](docs/tizen/LAUNCHER_CAPABILITIES.md), [docs/tizen/ENTERTAINMENT_HUB.md](docs/tizen/ENTERTAINMENT_HUB.md).

## What is versioned

| Path | Decision |
|------|----------|
| Root web app, `scripts/`, `tests/`, `docs/`, `tizen/ChulaOS/` source (including `config.xml`, icons, `.project`, `.tproject`) | Tracked. The Tizen tree is committed so the Studio project opens after clone; refresh it with `sync-tizen.sh` after web edits |
| `dist/` and the web zip | **Not tracked.** `build.sh` deletes and recreates them |
| `tizen/release/*.wgt`, `SIGNING_STATUS.txt`, `DEVICE_INFO.txt` | **Not tracked.** Local package and device-identity output |
| `author-signature.xml`, `signature*.xml`, `.manifest.tmp`, `*.p12` | **Not tracked.** Signing material |
| `research/`, APKs | **Not tracked.** |

An unsigned structural widget was committed in earlier local history, before this repository was published. It is removed from the current tree. History was not rewritten. Signed widgets were never committed. Do not add them. Put release binaries on GitHub Releases later if you want a downloadable artifact, and keep certificates on the signing machine.

## Testing status

Automated checks are static. They do not install Chula OS on a television and they do not prove remote, playback, or resume behavior.

| Check | Role |
|-------|------|
| `./scripts/validate.sh` | Repository integrity and `tests/validate.py` |
| `./scripts/verify-tizen-project.sh` | Tizen project shape without the SDK or a TV |
| `./scripts/check-tizen-sdk.sh` | Local SDK probe only |
| [docs/tizen/VERIFY_ON_DEVICE.md](docs/tizen/VERIFY_ON_DEVICE.md) | Manual TV checklist |

That on-device checklist is **not** filled in. This repository does not claim a completed physical TV test, a store submission, or a captured screenshot set.

On 27 October 2026 the maintainer machine reported:

| Command | Exit | What actually ran |
|---------|------|-------------------|
| `./scripts/validate.sh` | 0 | `node` was not installed, so the script used its Python brace-balance fallback, then `tests/validate.py` (`tests/validate.py OK`, version 1.0.0) |
| `./scripts/verify-tizen-project.sh` | 0 | Structural Tizen checks only |
| `./scripts/check-tizen-sdk.sh` | 0 | Tizen Studio, `tizen`, and `sdb` were present on that Mac. This is a local toolchain probe, not a television test |

Re-run the project scripts after changes. A later SDK probe can fail on a machine without Tizen Studio even when the web app is fine. Do not treat the table above as a device pass.

Those three commands were run again on this Mac after the GitHub Actions workflow was added. Validation and Tizen verification still exited 0, and `node --check` still did not run because Node.js is not installed. `./scripts/build.sh` exited 0 and wrote a gitignored `dist/`. Packaging, signing, and installation on a television were not run.

## Known issues

- Third-party widgets cannot permanently replace Smart Hub or capture the television Home key.
- With `background-support="disable"`, return-from-app behavior depends on whether the TV kept the process.
- Alias application ids and name matches still need a device confirmation per region and firmware.
- The Plex tile can open `https://www.plex.tv/`. That site is not the full Samsung TV app.
- Cinejoy is an optional external site behind a confirmation, not a trusted native app. YouCine is intentionally absent. See [docs/tizen/YOUCINE_NAVIGATION.md](docs/tizen/YOUCINE_NAVIGATION.md) and [docs/tizen/CINEJOY_NAVIGATION.md](docs/tizen/CINEJOY_NAVIGATION.md).
- DRM, login, and picture quality for web destinations depend on the TV browser.
- The service worker does not precache the wallpaper JPEG.
- Wi-Fi, Bluetooth, and panel settings stay in the television’s own UI.
- No Android package is produced.
- No open-source license file has been added yet.

## Roadmap

- Add real screenshots under `docs/screenshots/` after they are captured.
- Run [docs/tizen/VERIFY_ON_DEVICE.md](docs/tizen/VERIFY_ON_DEVICE.md) on hardware and record the firmware version with the results.
- Choose a license.
- Publish `dist/` zip files, and signed widgets if desired, as GitHub Release assets rather than git blobs.
- Confirm or remove native app aliases after a device pass.
- Revisit `background-support` only with a written reason and a device test.

## Documentation

- [Installation checklist](docs/INSTALL.md)
- [Handover report](docs/HANDOVER.md)
- [Tizen deployment](docs/tizen/TIZEN_DEPLOYMENT.md)
- [Launcher capabilities](docs/tizen/LAUNCHER_CAPABILITIES.md)
- [Entertainment Hub](docs/tizen/ENTERTAINMENT_HUB.md)
- [On-device verification](docs/tizen/VERIFY_ON_DEVICE.md)
- [Contributing](CONTRIBUTING.md)

## Credits

- Wallpaper: [Nunzio Guerrera / Unsplash](https://unsplash.com/photos/a-mountain-range-is-reflected-in-a-lake-gHZa4S4Fhfo) (Unsplash License)
- Font: Space Grotesk, self-hosted

## Author

Maintained by [Alpha781-77](https://github.com/Alpha781-77).

This repository is the source for that project. It does not list employment, certifications, or a device-test record.

## License

No `LICENSE` file is included. The wallpaper is a third-party Unsplash photograph and Space Grotesk is distributed under the SIL Open Font License, so one repository-wide license was not added on the maintainer’s behalf. Streaming services are opened at their official websites. Viewers need their own subscriptions. Chula OS does not redistribute proprietary applications, DRM circumvention tools, or unauthorized IPTV playlists.
