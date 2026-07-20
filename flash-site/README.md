# flash-site

The general public site for the project (published via GitHub Pages - see `.github/workflows/pages.yml`). The home page (`index.html`) offers two paths: flashing firmware onto an already-built boat (`flash.html`, using [esp-web-tools](https://esphome.github.io/esp-web-tools/) to flash `firmware/esp8266.bin` over Web Serial - no Arduino IDE needed), and configuring a new build (`configure.html`, the Variant picker that resolves a bottle/driver/motor/prop pick to a BOM and STL downloads - see CONTEXT.md: Variant, Configurator).

This is a plain static site, no build step.

## Releasing a new firmware build

1. Build the frontend and regenerate the embedded-website headers: `.\deployFrontend.ps1` (repo root).
2. Compile `MiniKenterpriseCode.ino` (Arduino IDE or `arduino-cli`) and export the binary as `esp8266.bin`.
3. Copy it to `flash-site/firmware/esp8266.bin`, overwriting the previous one.
4. Bump `"version"` in `flash-site/firmware/manifest.json`.
5. Commit and push - the Pages workflow republishes `flash-site/` automatically.

## Releasing a configurator/BOM update

1. Update `docs/materials/motorsAndProps.csv` and/or hand-edit `flash-site/js/data/variants.js` to reflect new motors/props/BOM parts/STL mappings. If you add a new fan-enclosure STL, drop it into the right `3dFiles/<bottle>_Bottle/` folder - name it `FanEnclosure_<bottle>_M<motorDiameter>_P<propDiameter>.stl` to be picked up automatically, or add an entry to `variants.js`'s `legacyOverrides` if it doesn't follow that convention.
2. Run `.\deployConfiguratorAssets.ps1` (repo root) - this rescans `3dFiles/` and regenerates `flash-site/js/data/stl-manifest.json` and `flash-site/downloads/`.
3. Preview locally per `docs/DEVELOPMENT.md` (`python -m http.server` inside `flash-site/`) - click through `configure.html`, checking that picker enabling/disabling looks right and every STL download link resolves.
4. Commit `flash-site/js/data/variants.js`, `stl-manifest.json` and `downloads/`, and push - the existing `flash-site/**`-triggered Pages workflow republishes everything automatically.
