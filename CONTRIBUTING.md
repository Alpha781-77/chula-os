# Contributing to Chula OS

Thanks for looking at the project. Chula OS is a browser and Samsung Tizen launcher. It is not television firmware, and pull requests must not try to replace Smart Hub, intercept the system Home key, or bypass a streaming service.

There is no open-source license file yet. See the [license note in the README](README.md#license). Do not assume you may reuse the source, the wallpaper, or the font beyond what their existing terms already allow.

## Before you change code

From the repository root:

```bash
./scripts/validate.sh
./scripts/verify-tizen-project.sh
```

`validate.sh` runs `node --check` when Node.js is on `PATH`. Without Node, it only checks that braces balance, then runs `tests/validate.py`. Install Node locally if you want the same syntax check that GitHub Actions runs.

If you edit the web app (`index.html`, `js/`, or styles), refresh the Tizen tree before packaging:

```bash
./scripts/sync-tizen.sh
./scripts/verify-tizen-project.sh
```

`./scripts/build.sh` recreates `dist/`. That directory is gitignored.

## What not to commit

- `dist/` and web zip files
- `tizen/release/`, including any `.wgt` and `DEVICE_INFO.txt`
- `author-signature.xml`, `signature*.xml`, `*.p12`, and other certificates
- `.env` files, tokens, and passwords
- `research/` and downloaded APKs

`./scripts/deploy-tizen.sh` talks to a television. Do not run it as part of a pull request, and do not claim a physical TV test unless you completed [docs/tizen/VERIFY_ON_DEVICE.md](docs/tizen/VERIFY_ON_DEVICE.md) and recorded the firmware version.

## Pull requests

Use a focused change and say what you ran. GitHub Actions runs source validation, Tizen structure checks, and the web build. It does not sign a widget or install anything on a TV.

Screenshots belong in `docs/screenshots/` only when they are real captures. Do not add placeholders that look like product photos.
