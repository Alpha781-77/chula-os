# Chula OS

**Version 1.0.0** — Premium Smart TV home launcher (web / PWA).  
**Proudly made in Kenya 🇰🇪**

Chula OS is a cinematic, remote-friendly TV home experience that launches official streaming web destinations and keeps your preferences on-device. It is **not** a firmware replacement for Samsung, LG, Android TV, or other TV operating systems.

## Quick start

```bash
cd "/Applications/Chula Os"
./scripts/validate.sh
python3 -m http.server 8765
```

Open [http://localhost:8765/](http://localhost:8765/) (fullscreen recommended).

Production package:

```bash
./scripts/build.sh
# → dist/ and dist/chula-os-1.0.0-web.zip
```

## Platform

| Target | Support |
|--------|---------|
| Smart TV / STB **web browser** + PWA | Supported (`dist/`) |
| **Samsung Tizen TV** (U6000F / Tizen 9.0) | **Primary hardware target** — see `docs/tizen/TIZEN_DEPLOYMENT.md` |
| Desktop browser (dev / demo) | Supported |
| Android TV APK | Not shipped |
| TV firmware / custom OS image | Not supported |

Tizen project: `tizen/ChulaOS/` · package: `./scripts/package-tizen.sh`

## Features

- Boot animation with Chula OS branding, then home (no branding on home)  
- Home: clock, greeting, network badge, status controls, streaming tiles  
- Launches: Stremio, YouTube TV, Netflix, Disney+, Prime Video, Apple TV+, configurable IPTV URL  
- All Apps library: search, categories, recent, favorites  
- Settings: display, sound, apps, startup, clock, accessibility, about  
- Persistent preferences (`localStorage`)  
- Offline launcher shell (service worker)  
- D-pad / keyboard navigation  

## Controls

| Input | Action |
|-------|--------|
| Arrow keys | Move focus |
| Enter / Space | Select |
| Esc / Backspace | Back |
| Home | Return to home (where supported) |
| F (in All Apps) | Toggle favorite |
| Ctrl/Cmd+Shift+R | Replay boot (demo) |
| `?boot=1` | Force boot on load |

## Project layout

```
├── index.html
├── styles.css / styles-app.css
├── js/                 # modular launcher
├── assets/             # wallpaper + fonts
├── icons/              # PWA icons
├── manifest.webmanifest
├── sw.js
├── scripts/build.sh
├── scripts/validate.sh
├── tests/validate.py
├── docs/HANDOVER.md
├── docs/INSTALL.md
└── dist/               # created by build.sh
```

## Documentation

- [Installation checklist](docs/INSTALL.md)  
- [Handover report](docs/HANDOVER.md)  

## Credits

- Wallpaper: [Nunzio Guerrera / Unsplash](https://unsplash.com/photos/a-mountain-range-is-reflected-in-a-lake-gHZa4S4Fhfo) (Unsplash License)  
- Font: Space Grotesk (self-hosted)  

## License note

Streaming services are opened at their official websites. You need your own subscriptions. Chula OS does not redistribute proprietary apps, DRM circumvention tools, or unauthorized IPTV playlists.
