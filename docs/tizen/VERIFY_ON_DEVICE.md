# On-device verification — Samsung U6000F (Tizen 9.0)

Run only after a **signed** `.wgt` installs and launches. Do not mark these passed from the Mac alone.

## Preflight

- [ ] `docs/tizen/../tizen/release/SIGNING_STATUS.txt` shows `STATUS=SIGNED`
- [ ] `sdb devices` lists the U6000F
- [ ] App opens from Apps / Downloaded apps as **Chula OS**

## Remote navigation

- [ ] Arrow keys move focus across home tiles without trapping
- [ ] Enter/OK opens the focused tile
- [ ] Focus ring remains visible on every interactive control
- [ ] Library and Settings are reachable and return cleanly

## Back handling

- [ ] Back from Library / Settings returns to Home (or previous view)
- [ ] On Home, first Back shows “Press Back again to exit”
- [ ] Second Back within ~2s exits to TV Apps / previous app
- [ ] Long Back / Exit exits without requiring a second press
- [ ] System **Home** still opens Smart Hub (Chula OS must **not** intercept it)

## Streaming launches

For each tile with an official HTTPS destination (YouTube, Netflix, etc.):

- [ ] Online + app/site available → leaves Chula OS into vendor UI or browser
- [ ] Offline → clear error toast / overlay, stays in Chula OS
- [ ] If native ID fails, AppControl VIEW falls back or shows graceful error
- [ ] No crash when destination app is missing

## Error states

- [ ] Invalid / empty IPTV URL → Settings notice, no blank navigation
- [ ] Airplane / unplugged network → online-required tiles refuse with message
- [ ] Toast and overlay dismiss with Back / timeout

## Performance / polish

- [ ] Boot animation completes or respects “skip boot” preference
- [ ] Home wallpaper and fonts load (no flash of unstyled tiles)
- [ ] No multi-second freezes during focus moves
- [ ] After returning from a stream, Chula OS resumes or can be reopened from Apps

## Out of scope (do not test as product requirements)

- Replacing Smart Hub permanently  
- Intercepting the system Home button  
- Root / firmware flash / sideload outside Developer Mode  

Record firmware version (Settings → Support → About) next to pass/fail notes.
