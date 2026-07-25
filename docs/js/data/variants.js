/*
 * Hand-authored Variant data for the Configurator (see CONTEXT.md: Variant, Configurator).
 * Sourced from docs/materials/motorsAndProps.csv, docs/materials/BOM.md, docs/materials/BOM_2022.md.
 *
 * legacyOverrides below map today's pre-naming-convention 3dFiles/ filenames to the
 * (bottle, motorDiameter, propDiameter) they're believed to fit. FanEnclosure55mm.stl and
 * FanHolder45mm.stl have no motor info in their filename, so their motor-diameter mapping here
 * is a best guess (the 7mm coreless motors, since only 8520 got a motor-specific file) -
 * confirm/correct this before relying on it. 3dFiles/05l_Bottle/FanEnclosure.stl is deliberately
 * left unmapped (ambiguous, see plan) - never reference it here.
 */

export const VARIANT_DATA = {
  meta: { schemaVersion: 1 },

  // The one guaranteed-valid, guaranteed-available combo pre-selected on first load - matches
  // the "vorarlberg-05l" preset below (the actually-built Vorarlberg Workshop setup).
  defaultVariant: { bottle: "05L", driver: "drv8833", motor: "720", prop: "55mm" },

  // Named, actually-built workshop setups - shown as one-click shortcuts above the pickers.
  presets: [
    {
      id: "vorarlberg-05l",
      label: "Vorarlberg Workshop",
      description: "0.5L bottle, DRV8833, 720 motor, 55mm prop.",
      image: "images/gallery/Vorarlberg_Variant_2024.JPG",
      selection: { bottle: "05L", driver: "drv8833", motor: "720", prop: "55mm" },
      recommended: true,
    },
    {
      id: "wilhelmshaven-1l",
      label: "Wilhelmshaven Workshop",
      description: "1L bottle, L9110, N20 motor, 55mm prop. A real, previously-built example - not the recommended starting point.",
      image: "images/gallery/Wilhelmshaven_Variant_2022.jpg",
      selection: { bottle: "1L", driver: "l9110", motor: "N20", prop: "55mm" },
    },
  ],

  bottles: {
    "05L": {
      label: "0.5 L",
      recommended: true,
      description: "Smallest and lightest - the fastest boat, and the most-built size so far.",
      connectorFile: "3dFiles/05l_Bottle/CenterPiece_ZiptieHoles.stl",
      parts: [
        { id: "bottle-05l", name: "Hard plastic 0.5L bottle (e.g. Coke, Sprite)", qty: 2 },
        { id: "connector-05l", name: "Centerpiece (3D printed electronics enclosure)", qty: 1 },
      ],
    },
    "075L": {
      label: "0.75 L",
      recommended: false,
      description: "Middle ground between 0.5L and 1L. Borrows its fan enclosure from either.",
      connectorFile: "3dFiles/075l_Bottle/Bridge.stl",
      parts: [
        { id: "bottle-075l", name: "Hard plastic 0.75L bottle", qty: 2 },
        { id: "connector-075l", name: "Bridge (3D printed electronics enclosure)", qty: 1 },
      ],
    },
    "1L": {
      label: "1 L",
      recommended: false,
      description: "Largest, most cargo/battery room. The original 2022 workshop size.",
      connectorFile: "3dFiles/1l_Bottle/Bridge.stl",
      parts: [
        { id: "bottle-1l", name: "Hard plastic 1L bottle", qty: 2 },
        { id: "connector-1l", name: "Bridge (3D printed electronics enclosure)", qty: 1 },
      ],
    },
  },

  drivers: {
    drv8833: {
      label: "DRV8833",
      recommended: true,
      image: "images/components/MotorDriver_DRV8833.jpeg",
      description: "Compact dual H-bridge driver board. Matches this firmware's default pin wiring.",
      pinSummary: "Uses a shared enable pin (EN) plus IN1-IN4, matching Config.h's DEFAULT_MOTOR_EN/IN1-IN4 exactly.",
      wiringHtml:
        "<p>DRV8833 wiring matches the firmware defaults directly: connect <code>EN</code> to <code>DEFAULT_MOTOR_EN</code> " +
        "(<code>GPIO15</code>/<code>D8</code>), and <code>IN1</code>-<code>IN4</code> to <code>DEFAULT_MOTOR_IN1</code>-<code>DEFAULT_MOTOR_IN4</code> " +
        "(<code>GPIO13</code>/<code>D7</code>, <code>GPIO12</code>/<code>D6</code>, <code>GPIO14</code>/<code>D5</code>, <code>GPIO16</code>/<code>D0</code>) as defined in <code>MiniKenterpriseCode/Config.h</code>. " +
        "No settings changes needed after flashing.</p>",
      parts: [
        {
          id: "driver-drv8833",
          name: "DRV8833 Dual H-Bridge motor driver board",
          qty: 1,
          image: "images/components/MotorDriver_DRV8833.jpeg",
          links: [{ label: "Amazon", url: "https://amzn.eu/d/0hsXaoIG" },{ label: "AliExpress", url: "https://de.aliexpress.com/item/1005009044264044.html" }]
        },
      ],
    },
    l9110: {
      label: "L9110",
      recommended: false,
      image: "images/components/MotorDriver_L9110.jpeg",
      description: "Often sold bundled with a fan+prop module - easier to source in Germany.",
      pinSummary: "No shared enable pin - each motor channel is driven by two logic pins directly.",
      wiringHtml:
        "<p><strong>L9110 wiring differs from the DRV8833 default.</strong> The L9110 has no enable pin " +
        "equivalent to the DRV8833's <code>EN</code> - each motor channel is just two logic inputs (<code>A-IA</code>/<code>A-IB</code> per " +
        "channel). This firmware's <code>Motor</code>/<code>PropulsionSystem</code> classes " +
        "(<code>MiniKenterpriseCode/Motor.h</code>, <code>PropulsionSystem.h</code>) assume a DRV8833-shaped " +
        "layout with a shared enable pin. Wire the L9110's two input pins per motor to the " +
        "<code>DEFAULT_MOTOR_IN1</code>-<code>IN4</code> pin roles from <code>Config.h</code>, and simply leave " +
        "the EN pin (<code>DEFAULT_MOTOR_EN</code>) unconnected - the firmware still drives it, but the L9110 " +
        "has nothing there to receive it, so it's a no-op rather than a wiring hazard. This is a documentation " +
        "workaround, not a firmware change: no code update is planned for native L9110 pin support yet.</p>",
      parts: [
        {
          id: "driver-l9110",
          name: "L9110 fan+motor+prop module",
          qty: 1,
          image: "images/components/MotorDriver_L9110.jpeg",
          links: [{ label: "reichelt", url: "https://www.reichelt.de/entwicklerboards-luefter-mit-propeller-modul-l9110-debo-fan-l9110-p282643.html" }],
        },
      ],
    },
  },

  // Only motor diameter drives fan-enclosure geometry (see stl-lookup.js) - validProps and
  // highCurrent come straight from docs/materials/motorsAndProps.csv.
  motors: {
    N20: {
      label: "N20",
      diameterMm: 12,
      type: "Permanent Magnet DC Motor",
      highCurrent: false,
      recommended: false,
      validProps: ["55mm"],
      parts: [{ id: "motor-n20", name: "N20 motor", qty: 1 }],
    },
    "716": {
      label: "716",
      diameterMm: 7,
      type: "Coreless DC Motor",
      highCurrent: false,
      recommended: false,
      validProps: ["45mm", "55mm"],
      parts: [{ id: "motor-716", name: "716 coreless motor", qty: 1, links: [{ label: "Amazon", url: "https://amzn.eu/d/0aft2ixm" }] }],
    },
    "720": {
      label: "720",
      diameterMm: 7,
      type: "Coreless DC Motor",
      highCurrent: false,
      recommended: true,
      validProps: ["55mm"],
      parts: [{ id: "motor-720", name: "720 coreless motor", qty: 1, links: [{ label: "Amazon", url: "https://amzn.eu/d/003OHyOD" }] }],
    },
    "8520": {
      label: "8520",
      diameterMm: 8.5,
      type: "Coreless DC Motor",
      highCurrent: true,
      recommended: false,
      validProps: ["55mm"],
      parts: [
        {
          id: "motor-8520",
          name: "8520 coreless motor",
          qty: 1,
          image: "images/components/MotorAndPropeller_8520.jpeg",
          note: "High current draw - needs the separate high-current BMS setup below, not the all-in-one board.",
        },
      ],
    },
    N30: {
      label: "N30",
      diameterMm: 12,
      type: "Permanent Magnet DC Motor",
      highCurrent: true,
      recommended: false,
      validProps: ["75mm"],
      parts: [
        {
          id: "motor-n30",
          name: "N30 motor",
          qty: 1,
          note: "High current draw - needs the separate high-current BMS setup below, not the all-in-one board.",
        },
      ],
    },
  },

  props: {
    "45mm": { label: "45 mm", parts: [{ id: "prop-45mm", name: "45mm propeller", qty: 1 }] },
    "55mm": { label: "55 mm", parts: [{ id: "prop-55mm", name: "55mm propeller", qty: 1 }] },
    "75mm": { label: "75 mm", parts: [{ id: "prop-75mm", name: "75mm propeller", qty: 1 }] },
  },

  // Pre-convention legacy files, mapped explicitly by (bottle, motorDiameter, propDiameter).
  // stl-lookup.js tries the naming-convention formula first and only falls back to this table.
  legacyOverrides: {
    "05L": {
      7: { "55mm": "3dFiles/05l_Bottle/FanEnclosure55mm.stl", "45mm": "3dFiles/05l_Bottle/FanHolder45mm.stl" },
      8.5: { "55mm": "3dFiles/05l_Bottle/FanEnclosure_M8520_P55.stl" },
    },
    "1L": {
      // FanHolder75mm.stl fits both despite the name - it's generic enough for N30+75mm and
      // N20+55mm alike.
      12: {
        "75mm": "3dFiles/1l_Bottle/FanHolder75mm.stl",
        "55mm": "3dFiles/1l_Bottle/FanHolder75mm.stl",
      },
    },
  },

  power: {
    lowCurrent: {
      label: "All-in-one charger + BMS",
      parts: [
        {
          id: "power-tp4056-bms-combo",
          name: "TP4056 all-in-one charger + BMS board (2-3A output)",
          qty: 1,
          // Filename says "TP4065" but this is the TP4056 board this project actually uses -
          // looks like a typo in the source photo's filename.
          image: "images/components/BMS_TP4065.jpg",
          links: [{ label: "reichelt", url: "https://www.reichelt.de/entwicklerboards-ladeplatine-fuer-3-7v-li-akkus-micro-usb-1a-debo2-3-7li-1-0a-p291400.html" }],
        },
      ],
    },
    highCurrent: {
      label: "Separate charger + high-current BMS",
      parts: [
        {
          id: "power-tp4056-chargeonly",
          name: "TP4056 charger-only board (no BMS)",
          qty: 1,
          links: [{ label: "reichelt", url: "https://www.reichelt.de/entwicklerboards-ladeplatine-fuer-3-7v-li-akkus-micro-usb-1a-debo2-3-7li-1-0a-p291400.html" }],
        },
        {
          id: "power-bms-highcurrent",
          name: "Separate 1S high-current BMS board (2+ MOSFETs)",
          qty: 1,
          links: [{ label: "AliExpress", url: "https://de.aliexpress.com/item/4001010955646.html" }],
        },
      ],
    },
  },

  // Axis-independent parts every Variant needs, split by BOM section. Images sourced from
  // docs/materials/images - jumper-wires uses SolidCoreWire.jpg as a best-guess match for
  // "stiff" jumper wire (as opposed to FlexibleWire.jpg); battery-holder has no dedicated photo.
  commonElectronicsParts: [
    {
      id: "mcu-d1mini",
      name: "Wemos D1 Mini microcontroller",
      qty: 1,
      image: "images/components/Microcontroller_WemosD1Mini.jpg",
      links: [
        { label: "AZ-Delivery", url: "https://www.az-delivery.de/products/d1-mini" },
        { label: "AliExpress", url: "https://de.aliexpress.com/item/32831353752.html" },
      ],
    },
    {
      id: "battery-18650",
      name: "18650 Li-Ion cell",
      qty: 1,
      image: "images/components/Battery_18650WithConnector.jpg",
      links: [{ label: "reichelt", url: "https://www.reichelt.de/industriezelle-18650-3-6-v-2850-mah-ungeschuetzt-1er-pack-sam-18650-29e-s-p278089.html" }],
    },
    {
      id: "battery-holder",
      name: "18650 battery holder",
      qty: 1,
      links: [{ label: "reichelt", url: "https://www.reichelt.de/batteriehalter-fuer-1-18650-zelle-pin-halter-ha-1x18650-p141630.html" }],
    },
    { id: "switch-toggle", name: "2-pin toggle switch", qty: 1, image: "images/components/Switch.jpg" },
    {
      id: "voltage-booster",
      name: "5V voltage booster/step-up module",
      qty: 1,
      image: "images/components/StepUpConverter_Small.jpeg",
      links: [{ label: "Amazon", url: "https://www.amazon.de/DollaTek-multifunktionales-DC-Lithium-Batterie-Boost-Modul-Step-Up-Board-Wandler-Spannungsregler/dp/B08HQQ32M2" }],
    },
    {
      id: "breadboard",
      name: "Mini breadboard (400 dots)",
      qty: 1,
      image: "images/components/Breadboard.jpg",
      links: [{ label: "AZ-Delivery", url: "https://www.az-delivery.de/products/mini-breadboard" }],
    },
    {
      id: "jumper-wires",
      name: "Stiff jumper wires",
      qty: 1,
      image: "images/components/SolidCoreWire.jpg",
      links: [{ label: "reichelt", url: "https://www.reichelt.de/steckbruecken-drahtbruecken-set-140-teilig-steckboard-dbs-p79056.html" }],
    },
    { id: "pin-headers", name: "Male pin headers", qty: 20, image: "images/components/PinHeader.jpg" },
    {
      id: "led-strip-ws2812b",
      name: "WS2812B Neopixel RGB LED strip",
      qty: 6,
      image: "images/components/Lights_WS2812BStrip.jpg",
      links: [{ label: "reichelt", url: "https://www.reichelt.de/entwicklerboards-flora-rgb-smart-neopixel-4er-pack-ws2811-debo-np-f-rgb-p235471.html" }],
    },
    {
      id: "resistor-180k",
      name: "180 kOhm resistor",
      qty: 1,
      image: "images/components/Resistor180k.jpg",
      links: [{ label: "reichelt", url: "https://www.reichelt.de/widerstand-metalloxyd-180-kohm-0207-1-0-w-5--1w-180k-p1791.html" }],
    },
  ],
  commonHardwareParts: [
    { id: "ziptie", name: "Ziptie, 200mm x 4.3mm", qty: 6 },
    {
      id: "lunchbox-container",
      name: "Mini lunch box / plastic container",
      qty: 1,
      note: "Minimum internal dimensions: 85mm x 56mm x 40mm - the electronics enclosure needs to fit inside.",
    },
  ],
};
