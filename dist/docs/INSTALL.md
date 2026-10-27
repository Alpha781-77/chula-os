# Chula OS — Installation Checklist

Use this list when you are ready to put Chula OS on your television.

## Before you start

- [ ] Mac/PC and TV are on the **same Wi-Fi / LAN**  
- [ ] You know your computer’s LAN IP (e.g. `192.168.1.20`)  
- [ ] TV has a web browser app (Samsung Internet, LG browser, Chrome, etc.)  
- [ ] You have accounts for any streaming services you want to use  

## A. Build on this computer (already done if `dist/` exists)

```bash
cd "/Applications/Chula Os"
./scripts/validate.sh
./scripts/build.sh
```

- [ ] `dist/chula-os-1.0.0-web.zip` exists  

## B. Serve the launcher

**Option 1 — quick LAN serve from the Mac**

```bash
cd "/Applications/Chula Os/dist"
python3 -m http.server 8765
```

- [ ] Server is running  
- [ ] Firewall allows port 8765 on the local network  

**Option 2 — copy to a always-on device**

- [ ] Copy `dist/` to a Raspberry Pi, NAS, or home server  
- [ ] Serve it with nginx, Caddy, or `python3 -m http.server`  

## C. Open on the TV

- [ ] On the TV browser, open `http://<LAN-IP>:8765/`  
- [ ] Watch the Chula OS boot animation once  
- [ ] Confirm home shows clock + app row (no permanent “Chula OS” title)  
- [ ] Enter fullscreen if available  

## D. Configure

- [ ] Open **Settings → Applications** and set IPTV URL only if you have a legitimate player page  
- [ ] Set wallpaper / clock / accessibility as desired  
- [ ] Optional: enable **Skip boot animation** after you are happy with startup  

## E. Verify apps

- [ ] YouTube opens (`youtube.com/tv`)  
- [ ] Netflix / Disney+ / Prime / Apple TV / Stremio open their official sites  
- [ ] Remote **Back** returns toward Chula OS (browser history)  
- [ ] **All Apps** search and categories work  
- [ ] Airplane/offline: launcher still loads from cache; streaming tiles warn correctly  

## F. Samsung Tizen install (U6000F)

Prefer the native Tizen path documented in [docs/tizen/TIZEN_DEPLOYMENT.md](tizen/TIZEN_DEPLOYMENT.md):

- [ ] Install Tizen Studio + TV Extensions 9.0 + Certificate Extension + JDK  
- [ ] Create Samsung certificate profile (Author + Distributor with TV DUID)  
- [ ] Enable Developer Mode on the TV; `sdb connect <TV_IP>`  
- [ ] `./scripts/package-tizen.sh` → install the **signed** `.wgt`  
- [ ] Confirm boot, remote navigation, and app launches on the TV  

Until the SDK is installed, only an **UNSIGNED** structural `.wgt` exists and **cannot** be installed on the retail TV.

## G. What this product does *not* do

- [ ] Understood: does not flash TV firmware  
- [ ] Understood: does not replace Smart Hub or permanently intercept the system Home key  
- [ ] Understood: no pirated streams or cracked APKs are included  

## If something fails

1. Re-run `./scripts/validate.sh` on the Mac  
2. Confirm the TV can ping/load the Mac IP in its browser  
3. Try Chrome/Edge on the Mac at the same URL to isolate TV browser issues  
4. Clear site data / hard refresh if an old prototype was cached  
