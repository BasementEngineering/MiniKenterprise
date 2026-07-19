# Development Quickstart

This repo has three independently runnable pieces: the Control UI **frontend** (`minikenterprise_frontend/`), the **firmware** (`MiniKenterpriseCode/`), and the public **distribution page** (`flash-site/`). Each section below covers one.

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

## Distribution page (flash-site): running it locally

`flash-site/` is a plain static page (no build step) that lets anyone flash a prebuilt `.bin` straight from the browser via Web Serial — see `flash-site/README.md` for the full release process. To preview it locally:
```
cd flash-site
python -m http.server 8080
```
Open http://localhost:8080 — Web Serial requires a secure context, and `localhost` counts as one, so this works without HTTPS. Actually flashing still needs a real board plugged in over USB, in Chrome or Edge.
