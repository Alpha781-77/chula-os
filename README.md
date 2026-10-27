# Chula OS — Browser Prototype

A lightweight **browser prototype** of a premium smart-TV home interface (16:9, up to 4K). Plain HTML, CSS, and vanilla JavaScript — no build step, no backend, no required network at runtime.

> **Important:** This is a front-end UI demo only. It does **not** replace Samsung Smart Hub, does **not** modify TV firmware or the TV boot logo, and does **not** install or control real apps. Tiles and status icons are visual prototypes only.

## Run locally

```bash
cd "/Applications/Chula Os"
```

Then either:

1. **Double-click** `index.html`, or  
2. Serve the folder:

   ```bash
   python3 -m http.server 8765
   ```

   Open [http://localhost:8765/](http://localhost:8765/)

Fullscreen (**F11**) on a 16:9 display looks best.

## Boot sequence

1. Jet-black screen (`#030308`)  
2. Electric-cyan light sweep reveals the **Chula OS** wordmark  
3. Royal-amethyst arc traces around the logo with cyan edge light  
4. **EXPERIENCE CHULA OS**  
5. **Proudly made in Kenya 🇰🇪**  
6. Cyan/violet loading bar  
7. Fade into the home screen  

OS branding appears **only** during boot.

## Home screen

- Local cinematic mountain-lake wallpaper (Unsplash photo + SVG fallback)  
- Large clock / date (upper-left); no fake weather (offline prototype)  
- Search, Wi-Fi, Bluetooth, Settings icons (upper-right)  
- App tiles: Stremio, YouTube, Netflix, Disney+, Prime Video, Apple TV, IPTV, All Apps  
- Cyan + amethyst focus ring for remote-style navigation  

## Demo: replay startup

| Method | How |
|--------|-----|
| Keyboard | **`R`** |
| URL | `index.html?boot=1` or `#demo` |
| Console | `ChulaOS.replayBoot()` |

## Keyboard / remote

| Key | Action |
|-----|--------|
| ← → ↑ ↓ | Move focus (tiles ↔ status icons) |
| Enter / Space | Select |
| Escape / Backspace | Dismiss toast / return focus to tiles |
| R | Replay boot |

## Project structure

```
Chula Os/
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── wallpaper.jpg          # Local Unsplash photo (optimized ~2560px)
│   ├── wallpaper.svg          # Gradient fallback
│   └── fonts/                 # Space Grotesk (self-hosted)
└── README.md
```

## Assets & credits

- **Wallpaper:** [Nunzio Guerrera / Unsplash](https://unsplash.com/photos/a-mountain-range-is-reflected-in-a-lake-gHZa4S4Fhfo) — Vermilion Lakes, Banff at sunset (snow peaks, lake reflection). Free under the [Unsplash License](https://unsplash.com/license). Stored locally at **3840×2160** with an amethyst/indigo color grade.  
- **Font:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — self-hosted woff2 files (no runtime CDN).

## Scope limits

- Browser UI prototype only  
- No Smart Hub / firmware integration  
- No live weather, Wi-Fi, or app launches  
- App tiles do not open real applications  
