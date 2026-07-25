# Mini Kenterprise

An ESP8266-based RC boat that people build themselves from a workshop kit, then control from a browser. This context covers the firmware (`MiniKenterpriseCode/`) and its companion web tooling (`minikenterprise_frontend/`, the public site in `docs/`) that get someone from a freshly-soldered board to a boat they can drive, without an Arduino IDE install.

## Language

**Settings**:
The single flat, runtime-editable record of everything a builder might need to change without recompiling: WiFi mode/credentials and the named GPIO pin assignments. Persisted in EEPROM behind a magic-byte validity check; falls back to the compiled-in defaults on first boot or corruption.
_Avoid_: Config (that's the compile-time defaults in `Config.h`, not the runtime record), Preferences (not used here — that's Duck's NVS-based approach).

**Config.h defaults**:
The compiled-in fallback values (pins, AP SSID/password, PWM limits) used only to seed `Settings` the first time the device boots, or after a factory reset. Never read directly at runtime once `Settings` has loaded.
_Avoid_: "the config" as a synonym for `Settings` — they're different lifecycles (one is baked into the firmware image, the other lives in EEPROM and survives reflashing).

**AP mode / Station mode**:
The two WiFi roles the boat can run in, chosen at runtime via `Settings.apMode` (not compile-time anymore). AP mode: the boat hosts its own network and a controller connects to it directly. Station mode: the boat joins an existing WiFi network. If Station mode fails to connect within its timeout, the boat automatically falls back to AP mode so it's never left unreachable.
_Avoid_: "hotspot" for AP mode.

**the site**:
The general public web presence for the project, published from `docs/` (formerly its own `flash-site/` folder — moved so it sits as a sibling of `docs/images/` and `docs/materials/` and can link to them directly, no copying; see `docs/adr/0007-consolidate-site-and-docs-under-docs-folder.md`). Its home page (`index.html`) offers three paths: flashing a prebuilt firmware `.bin` over Web Serial via esp-web-tools (`flash.html`, the "visit a page, click a button" install experience), configuring a new build (`configure.html`, the Variant picker + BOM + STL downloads — see Configurator), and the Build Guide (`docs/build/index.html`, which fetches and renders `docs/build/BuildGuide.md` client-side via the `marked` library loaded from a CDN — no build step, same pattern as esp-web-tools). `docs/materials/BOM.md` remains a maintained, human-readable BOM reference alongside the interactive Configurator, not archival — the material that's actually archival (old workshop slide decks/handouts) lives outside git entirely, in the gitignored top-level `workshop-archive/`.
_Avoid_: "the website" (ambiguous with the on-device control UI served by the firmware itself). "flash-site" (the old folder name — gone; don't reintroduce it in new docs, though you'll still see it in history and older ADRs). "The flashing site" alone, now that it's not flashing-only.

**Variant**:
One specific, buildable combination of the four choices a builder makes — bottle size, motor driver, motor, and its (motor-dependent) prop diameter — that the Configurator resolves to a concrete BOM and a concrete set of STL files to print. Not every combination of the four choices is a Variant; only ones with real, mapped print files in the Configurator's data are offered.
_Avoid_: "Version" (the numbered pin-layout naming this project already retired in `Config.h`'s `// previously "VERSION3"` comment; not being reintroduced for hardware configurations either — note the existing `README.md` "Hardware Versions So Far" section predates this and isn't being renamed as part of this). "Build" (ambiguous with a compiled firmware binary or an `npm run build`).

**Configurator**:
`docs/configure.html` and its `docs/js/` modules — lets a prospective builder pick a Variant and see the resulting BOM and STL download links, before anything is built or flashed. Distinct from the Control UI (runs on an already-built, already-flashed boat) and from flashing (installs firmware onto already-built hardware).

**Control UI**:
The on-device web app (built from `minikenterprise_frontend/`, embedded into the firmware binary as PROGMEM byte arrays) that a builder's browser loads directly from the boat over WiFi, to drive it and adjust `Settings`.
_Avoid_: "frontend" alone — ambiguous between this and the site.

**Dev stub**:
A dev-only Node script (`minikenterprise_frontend/dev-stub.js`) that mocks both wire protocols the Control UI speaks to the real firmware — the `/api/settings` GET/POST HTTP protocol and the boat-control WebSocket on `:81` — so the whole Control UI, settings page and live boat control alike, can be developed, driven, and debugged locally without a flashed board. It logs every decoded control command to the terminal and replies to heartbeats/pushes simulated status so the UI behaves as if connected.
_Avoid_: confusing with `FrontendServer` or the firmware's `WebSocketsServer` (the real on-device servers) — the stub only exists on a developer's machine, never in firmware, and mirrors protocol shape only, not EEPROM storage, restart semantics, or real motor/LED behavior.

## Example dialogue

> "Where does someone change the boat's WiFi password?"
> "The Control UI's settings page — it reads and writes `Settings`, not `Config.h`. `Config.h` only matters on first boot, to seed the default `Settings`."
>
> "And if they type the wrong WiFi password for Station mode?"
> "It tries to connect, times out, and falls back to AP mode automatically — they reconnect to the boat's own network and fix it from there."
>
> "Is that the same page as the site?"
> "No — the site (`docs/`) is a separate, public site. Its flashing page installs the `.bin` the first time. The Control UI only exists once the firmware is already on the board."
>
> "Where do I find out what parts I need to build one?"
> "The site's Configurator — pick a Variant (bottle size, driver, motor, prop) and it resolves the BOM and STL downloads for that exact combination. `docs/materials/BOM.md` is still a maintained reference too, just not interactive."
