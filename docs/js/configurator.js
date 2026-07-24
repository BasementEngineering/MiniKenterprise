import { VARIANT_DATA } from "./data/variants.js";
import { resolveFanFile, resolveConnectorFile, availablePropsFor, availableMotorsFor } from "./stl-lookup.js";
import { readSelectionFromUrl, writeSelectionToUrl } from "./urlState.js";
import { composeBom, groupBomBySection } from "./bom.js";

const data = VARIANT_DATA;
let knownFiles = new Set();
let selection = { ...data.defaultVariant };

async function loadKnownFiles() {
  try {
    const response = await fetch("./js/data/stl-manifest.json");
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const paths = await response.json();
    knownFiles = new Set(paths);
  } catch (err) {
    console.warn(
      "Could not load stl-manifest.json (run deployConfiguratorAssets.ps1 to generate it). " +
        "Only legacy-mapped combos will resolve until then.",
      err
    );
    knownFiles = new Set();
  }
}

function renderPickerGroup(container, options, selectedId, { disabledIds = new Set(), onSelect }) {
  container.innerHTML = "";
  for (const [id, option] of Object.entries(options)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-option" + (id === selectedId ? " selected" : "");
    if (option.image) {
      const thumb = document.createElement("img");
      thumb.className = "picker-thumb";
      thumb.src = `./${option.image}`;
      thumb.alt = option.label;
      button.appendChild(thumb);
    }
    button.appendChild(document.createTextNode(option.label));
    if (option.recommended) {
      const badge = document.createElement("span");
      badge.className = "recommended-badge";
      badge.textContent = "Recommended";
      button.appendChild(badge);
    }
    if (disabledIds.has(id)) {
      button.disabled = true;
      button.title = "No printed parts available yet for this combination.";
      button.classList.add("unavailable");
    } else {
      button.addEventListener("click", () => onSelect(id));
    }
    container.appendChild(button);
  }
}

function selectionsMatch(a, b) {
  return a.bottle === b.bottle && a.driver === b.driver && a.motor === b.motor && a.prop === b.prop;
}

function renderPresets() {
  const container = document.getElementById("presetPicker");
  container.innerHTML = "";

  for (const preset of data.presets) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-option" + (selectionsMatch(selection, preset.selection) ? " selected" : "");
    const imageHtml = preset.image ? `<img class="preset-thumb" src="./${preset.image}" alt="">` : "";
    const badgeHtml = preset.recommended ? `<span class="recommended-badge">Recommended</span>` : "";
    button.innerHTML = `${imageHtml}<strong>${preset.label}</strong>${badgeHtml}<span>${preset.description}</span>`;
    button.addEventListener("click", () => {
      selection = { ...preset.selection };
      render();
    });
    container.appendChild(button);
  }
}

function renderBom() {
  const bomOutput = document.getElementById("bomOutput");
  bomOutput.innerHTML = "";
  const grouped = groupBomBySection(composeBom(data, selection));

  for (const group of grouped) {
    const heading = document.createElement("h3");
    heading.textContent = group.section;
    bomOutput.appendChild(heading);

    const table = document.createElement("table");
    table.className = "bom-table";
    for (const part of group.parts) {
      const thumbHtml = part.image
        ? `<img class="bom-thumb" src="./${part.image}" alt="">`
        : `<span class="bom-thumb bom-thumb-placeholder"></span>`;
      const buyHtml = part.links?.length
        ? part.links.map((link) => `<a href="${link.url}" target="_blank" rel="noopener">${link.label}</a>`).join(" ")
        : "";
      const row = document.createElement("tr");
      row.innerHTML = `<td>${thumbHtml}${part.name}</td><td>${part.qty}x</td><td class="bom-buy">${buyHtml}</td>`;
      if (part.note) {
        const noteRow = document.createElement("tr");
        noteRow.innerHTML = `<td colspan="3" class="bom-note">${part.note}</td>`;
        table.appendChild(row);
        table.appendChild(noteRow);
        continue;
      }
      table.appendChild(row);
    }
    bomOutput.appendChild(table);
  }
}

function renderStlDownloads() {
  const container = document.getElementById("stlDownloads");
  container.innerHTML = "";

  const connectorFile = resolveConnectorFile(data, selection.bottle);
  const fanFile = resolveFanFile(data, knownFiles, selection.bottle, selection.motor, selection.prop);

  const entries = [
    { label: "Centerpiece (connector)", file: connectorFile, qty: 1 },
    { label: "Fan enclosure", file: fanFile, qty: 2 },
  ];

  for (const entry of entries) {
    const item = document.createElement("li");
    if (entry.file) {
      const downloadPath = `https://raw.githubusercontent.com/BasementEngineering/MiniKenterprise/main/${entry.file}`;
      item.innerHTML = `<a href="${downloadPath}">${entry.label} (print ${entry.qty}x)</a>`;
    } else {
      item.textContent = `${entry.label}: not available yet for this combination.`;
      item.className = "stl-unavailable";
    }
    container.appendChild(item);
  }
}

function renderWiringNotes() {
  const container = document.getElementById("wiringNotes");
  container.innerHTML = data.drivers[selection.driver].wiringHtml;
}

function clampSelectionToAvailability() {
  const availableMotors = availableMotorsFor(data, knownFiles, selection.bottle);
  if (!availableMotors.includes(selection.motor)) {
    selection.motor = availableMotors[0] ?? data.defaultVariant.motor;
  }

  const availableProps = availablePropsFor(data, knownFiles, selection.bottle, selection.motor);
  if (!availableProps.includes(selection.prop)) {
    selection.prop = availableProps[0] ?? data.defaultVariant.prop;
  }
}

function render() {
  clampSelectionToAvailability();

  const availableMotorIds = new Set(availableMotorsFor(data, knownFiles, selection.bottle));
  const unavailableMotorIds = new Set(Object.keys(data.motors).filter((id) => !availableMotorIds.has(id)));

  const availablePropIds = new Set(availablePropsFor(data, knownFiles, selection.bottle, selection.motor));
  const unavailablePropIds = new Set(Object.keys(data.props).filter((id) => !availablePropIds.has(id)));

  renderPickerGroup(document.getElementById("bottlePicker"), data.bottles, selection.bottle, {
    onSelect: (id) => {
      selection.bottle = id;
      render();
    },
  });

  renderPickerGroup(document.getElementById("driverPicker"), data.drivers, selection.driver, {
    onSelect: (id) => {
      selection.driver = id;
      render();
    },
  });

  renderPickerGroup(document.getElementById("motorPicker"), data.motors, selection.motor, {
    disabledIds: unavailableMotorIds,
    onSelect: (id) => {
      selection.motor = id;
      render();
    },
  });

  renderPickerGroup(document.getElementById("propPicker"), data.props, selection.prop, {
    disabledIds: unavailablePropIds,
    onSelect: (id) => {
      selection.prop = id;
      render();
    },
  });

  renderPresets();
  renderBom();
  renderStlDownloads();
  renderWiringNotes();
  writeSelectionToUrl(selection);
}

function initCustomizeToggle() {
  const toggleButton = document.getElementById("toggleCustomize");
  const optionsContainer = document.getElementById("customizeOptions");

  toggleButton.addEventListener("click", () => {
    const expanded = optionsContainer.hidden;
    optionsContainer.hidden = !expanded;
    toggleButton.textContent = expanded ? "Customize your setup ▾" : "Customize your setup ▸";
  });
}

async function init() {
  initCustomizeToggle();
  await loadKnownFiles();
  selection = readSelectionFromUrl(data);

  // If the loaded selection isn't one of the presets (e.g. a shared link with a custom pick),
  // show the picker panel up front so the picks aren't hidden behind a collapsed toggle.
  const matchesAnyPreset = data.presets.some((preset) => selectionsMatch(selection, preset.selection));
  if (!matchesAnyPreset) {
    document.getElementById("customizeOptions").hidden = false;
    document.getElementById("toggleCustomize").textContent = "Customize your setup ▾";
  }

  render();
}

init();
