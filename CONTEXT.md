# Mini Kenterprise

An ESP8266-based RC boat that people build themselves from a workshop kit, then control from a browser. This context covers the firmware (`MiniKenterpriseCode/`) and its companion web tooling (`minikenterprise_frontend/`, `flash-site/`) that get someone from a freshly-soldered board to a boat they can drive, without an Arduino IDE install.

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

**flash-site**:
The minimal public web page (esp-web-tools install button) that flashes a prebuilt firmware `.bin` onto the board over Web Serial — the "visit a page, click a button" install experience. Distinct from `docs/`, which holds workshop/BOM materials, not the install page.
_Avoid_: "the website" (ambiguous with the on-device control UI served by the firmware itself).

**Control UI**:
The on-device web app (built from `minikenterprise_frontend/`, embedded into the firmware binary as PROGMEM byte arrays) that a builder's browser loads directly from the boat over WiFi, to drive it and adjust `Settings`.
_Avoid_: "frontend" alone — ambiguous between this and `flash-site`.

## Example dialogue

> "Where does someone change the boat's WiFi password?"
> "The Control UI's settings page — it reads and writes `Settings`, not `Config.h`. `Config.h` only matters on first boot, to seed the default `Settings`."
>
> "And if they type the wrong WiFi password for Station mode?"
> "It tries to connect, times out, and falls back to AP mode automatically — they reconnect to the boat's own network and fix it from there."
>
> "Is that the same page as the flash-site?"
> "No — flash-site is a separate, public page just for flashing the `.bin` the first time. The Control UI only exists once the firmware is already on the board."
