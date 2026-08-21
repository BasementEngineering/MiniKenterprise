# Development Quickstart

This repo has three independently runnable pieces: the Control UI **frontend** (`minikenterprise_frontend/`), the **firmware** (`MiniKenterpriseCode/`), and the public **site** (`docs/`). Each section below covers one.

## Frontend

```
cd minikenterprise_frontend
npm install        # once
npm run dev-stub   # terminal A - mocks the boat's settings HTTP API (:8787) and control WebSocket (:81)
npm run dev        # terminal B - Vite dev server
```

Open:
- Control UI: http://localhost:5173/
- Settings page: http://localhost:5173/settings/

No hardware needed — `dev-stub` fakes both wire protocols the firmware speaks (settings + boat control), replies to heartbeats, and drifts simulated battery/network status. Watch the `dev-stub` terminal to see every command the frontend sends, decoded live (e.g. `[control] recv: ControlLR 45 -10`). See `docs/adr/0005-unify-dev-stub-for-boat-control-and-settings.md`.

## Building the frontend and embedding it into the firmware

The firmware serves the frontend from flash as PROGMEM byte arrays, not from a filesystem (`docs/adr/0001-embed-frontend-as-progmem.md`), so it has to be re-encoded after every frontend change.

Full pipeline, one command from the repo root (builds, encodes, and copies the generated headers into `MiniKenterpriseCode/`):
```
.\deployFrontend.ps1
```

Or step by step:
```
cd minikenterprise_frontend
npm run build                              # -> dist/
python ../tools/encodeInArduino.py dist     # -> dist/website_content.h + website_functions.h
```

**Size**: `encodeInArduino.py` prints a per-file size and a total, e.g.:
```
Total embedded size: 76829 bytes across 8 files
```
That's flash usage (PROGMEM), not RAM — it doesn't compete with the ESP8266's heap. The number that actually matters is the "Sketch uses X bytes (Y%) of program storage space" line the Arduino IDE/`arduino-cli` prints after compiling `MiniKenterpriseCode.ino`, which is bounded by the flash-size partition chosen for the board (Tools > Flash Size in the IDE). Check that after any frontend growth, not just the embed-step total — there's no automated budget check for either number yet.

## Testing options

No automated test suite exists yet — the project relies on manual testing instead:
- **Frontend only**: `npm run dev-stub` + `npm run dev` (above), drive the Control UI/settings page in a browser, and watch the stub terminal for exactly what gets sent. This isolates frontend bugs from backend/hardware bugs before ever touching a board.
- **Full firmware, on real hardware**: flash a board (below) and exercise the actual control loop, motor output, EEPROM-backed settings persistence, and AP/Station WiFi fallback — none of which the stub simulates.

## Firmware: developing and uploading

Source lives in `MiniKenterpriseCode/`, with `MiniKenterpriseCode.ino` as the sketch entry point.

- **Arduino IDE** (1.x or 2.x): open `MiniKenterpriseCode.ino`, select your board (Wemos D1 Mini: "LOLIN(WEMOS) D1 R2 & mini"), then Sketch > Upload.
- **arduino-cli**:
  ```
  arduino-cli compile --fqbn esp8266:esp8266:d1_mini MiniKenterpriseCode
  arduino-cli upload --fqbn esp8266:esp8266:d1_mini -p <PORT> MiniKenterpriseCode
  ```

Re-run the frontend build/embed step above first if you changed anything under `minikenterprise_frontend/` — the checked-in `website_content.h`/`website_functions.h` don't regenerate themselves.

## The site (`docs/`): running it locally and releasing

`docs/` is a plain static site (no build step) published via GitHub Pages (`.github/workflows/pages.yml` uploads `docs/` as-is — no CI build step either). It lives under `docs/` specifically so it can reference `docs/images/` and `docs/materials/` with plain relative links, instead of copying them into a separate folder. It has three paths from its home page: flashing a prebuilt `.bin` straight from the browser via Web Serial (`flash.html`), configuring a new build — picking a bottle/driver/motor/prop Variant to get the right BOM and STL downloads (`configure.html`) — and the Build Guide (`docs/build/index.html`), which fetches `docs/build/BuildGuide.md` and renders it client-side with the `marked` library loaded from a CDN (same no-build-step approach as `flash.html`'s esp-web-tools). Since `docs/build/index.html` sits in the same folder as `BuildGuide.md`, the guide's relative image/file links (e.g. `../images/build/...`, `../../3dFiles`) resolve correctly without any rewriting — edit `BuildGuide.md` like any other markdown file and the rendered page picks it up as-is.

`BuildGuide.md` always covers the current recommended Variant only (Vorarlberg as of this writing) — older guides for superseded setups aren't deleted, just renamed to `BuildGuide_<Name>.md` and added to the `GUIDES` map in `docs/build/index.html`'s script, which switches between them via a `?guide=<name>` query param (the same query-string-as-state idiom `configure.html`'s `js/urlState.js` uses for Variant picks). Add a small link for each archived guide to the `.guide-switcher` nav in `docs/build/index.html` so it stays reachable.

To preview any of them locally:
```
cd docs
python -m http.server 8080
```
Open http://localhost:8080 — Web Serial requires a secure context, and `localhost` counts as one, so this works without HTTPS. Actually flashing still needs a real board plugged in over USB, in Chrome or Edge. `configure.html` needs no hardware; its STL download links point at `raw.githubusercontent.com/BasementEngineering/MiniKenterprise/main/3dFiles/...`, so they fetch from the pushed `main` branch even when previewing locally — a new STL you haven't pushed yet won't download until it's on `main`. The Build Guide needs internet access (to load `marked` from the CDN) even when previewing locally.

The home-page gallery registers `docs/sw.js` as a service worker. After one successful online visit, it caches the home page shell, gallery manifest, and every current gallery image so the carousel can run offline. Cache paths are derived from the service worker scope, so this works on the GitHub Pages project URL and at the local preview URL.

### Releasing a new firmware build

1. Build the frontend and regenerate the embedded-website headers: `.\deployFrontend.ps1` (repo root).
2. Compile `MiniKenterpriseCode.ino` (Arduino IDE or `arduino-cli`) and export the binary as `esp8266.bin`.
3. Copy it to `docs/firmware/esp8266.bin`, overwriting the previous one.
4. Bump `"version"` in `docs/firmware/manifest.json`.
5. Commit and push — the Pages workflow republishes `docs/` automatically.

### Releasing a configurator/BOM update

1. Update `docs/materials/motorsAndProps.csv` and/or hand-edit `docs/js/data/variants.js` to reflect new motors/props/BOM parts/STL mappings. If you add a new fan-enclosure STL, drop it into the right `3dFiles/<bottle>_Bottle/` folder — name it `FanEnclosure_<bottle>_M<motorDiameter>_P<propDiameter>.stl` to be picked up automatically, or add an entry to `variants.js`'s `legacyOverrides` if it doesn't follow that convention. Component/gallery photos live under `docs/images/components/` and `docs/images/gallery/` respectively and are referenced directly — no copy step.
2. Run `.\deployConfiguratorAssets.ps1` (repo root) — this rescans `3dFiles/` and regenerates `docs/js/data/stl-manifest.json`.
3. Preview locally (above) — click through `configure.html`, checking that picker enabling/disabling looks right. STL download links will only resolve against files already on `main`.
4. Commit `docs/js/data/variants.js` and `stl-manifest.json` (and any new files under `3dFiles/`), and push — the Pages workflow republishes `docs/` automatically.
