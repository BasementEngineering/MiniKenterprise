# flash-site

The public "flash your boat" install page (published via GitHub Pages - see `.github/workflows/pages.yml`). Uses [esp-web-tools](https://esphome.github.io/esp-web-tools/) to flash `firmware/esp8266.bin` over Web Serial - no Arduino IDE needed.

This is a plain static page, no build step.

## Releasing a new firmware build

1. Build the frontend and regenerate the embedded-website headers: `.\deployFrontend.ps1` (repo root).
2. Compile `MiniKenterpriseCode.ino` (Arduino IDE or `arduino-cli`) and export the binary as `esp8266.bin`.
3. Copy it to `flash-site/firmware/esp8266.bin`, overwriting the previous one.
4. Bump `"version"` in `flash-site/firmware/manifest.json`.
5. Commit and push - the Pages workflow republishes `flash-site/` automatically.
