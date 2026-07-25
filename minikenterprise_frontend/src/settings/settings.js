import { translate } from "./i18n.js";

const form = document.getElementById("settings-form");
const statusMessage = document.getElementById("status-message");
const apModeHidden = document.getElementById("apMode");
const apModeToggle = document.getElementById("ap-mode-toggle");
const modePictogram = document.getElementById("mode-pictogram");
const modeExplanation = document.getElementById("mode-explanation");
const apFallbackNote = document.getElementById("ap-fallback-note");
const stationFields = document.getElementById("station-fields");
const staSsidInput = document.getElementById("staSsid");
const staPasswordInput = document.getElementById("staPassword");

// apModeHidden.value is the source of truth ("1" = AP, "0" = Station); the
// checkbox, pictogram, explanation text and Station fields are all just
// views onto it. AP settings stay editable in both modes since AP is also
// the automatic fallback if a Station connection attempt fails.
function updateModeUI() {
    const isStation = apModeHidden.value === "0";
    apModeToggle.checked = isStation;
    modePictogram.classList.toggle("mode-station", isStation);
    apFallbackNote.classList.toggle("visible", isStation);
    stationFields.classList.toggle("settings-group--inactive", !isStation);
    staSsidInput.disabled = !isStation;
    staPasswordInput.disabled = !isStation;

    const key = isStation ? "staModeExplanation" : "apModeExplanation";
    modeExplanation.dataset.i18n = key;
    modeExplanation.textContent = translate(key);
}

apModeToggle.addEventListener("change", () => {
    apModeHidden.value = apModeToggle.checked ? "0" : "1";
    updateModeUI();
});

updateModeUI();

// Live pin-assignment tags: annotate the diagram with which setting (Motor
// Enable/In1-4, LED) currently points at each GPIO, so the diagram stays
// useful once real values are typed in, not just as a static reference.
const PIN_ASSIGNMENT_FIELDS = [
    { id: "motorEn", tag: "EN" },
    { id: "motorIn1", tag: "IN1" },
    { id: "motorIn2", tag: "IN2" },
    { id: "motorIn3", tag: "IN3" },
    { id: "motorIn4", tag: "IN4" },
    { id: "ledPin", tag: "LED" },
];

const pinRows = Array.from(document.querySelectorAll(".pinout-diagram .pinout-row[data-gpio]"));
const basePinGpioText = new Map(
    pinRows.map(row => [row, row.querySelector(".pin-gpio").textContent])
);

// The diagram's own annotated pins are the canonical list of GPIOs that
// physically exist on this board (e.g. GPIO6-11 are never broken out) -
// reuse that instead of maintaining a second list that could drift from it.
const validGpioNumbers = new Set(pinRows.map(row => row.dataset.gpio));
const pinFieldIds = PIN_ASSIGNMENT_FIELDS.map(({ id }) => id);

function validatePinField(input) {
    const value = input.value.trim();
    const isValid = value !== "" && validGpioNumbers.has(value);
    input.setCustomValidity(isValid ? "" : translate("pinValidationMessage"));
}

function validateAllPinFields() {
    pinFieldIds.forEach(id => validatePinField(document.getElementById(id)));
}

function updatePinAssignments() {
    const tagsByGpio = new Map();
    PIN_ASSIGNMENT_FIELDS.forEach(({ id, tag }) => {
        const value = document.getElementById(id).value.trim();
        if (value === "") return;
        if (!tagsByGpio.has(value)) tagsByGpio.set(value, []);
        tagsByGpio.get(value).push(tag);
    });

    pinRows.forEach(row => {
        const gpioText = row.querySelector(".pin-gpio");
        const tags = tagsByGpio.get(row.dataset.gpio);

        gpioText.textContent = basePinGpioText.get(row);
        if (tags) {
            const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            tspan.setAttribute("class", "pin-assignment");
            tspan.textContent = " " + tags.join("+");
            gpioText.appendChild(tspan);
        }
    });
}

PIN_ASSIGNMENT_FIELDS.forEach(({ id }) => {
    document.getElementById(id).addEventListener("input", updatePinAssignments);
});

pinFieldIds.forEach(id => {
    document.getElementById(id).addEventListener("input", () => validatePinField(document.getElementById(id)));
});

updatePinAssignments();
validateAllPinFields();

// Mirrors MiniKenterpriseCode/Config.h's compile-time defaults. Keep in
// sync manually if those ever change - there's no runtime way to ask the
// firmware for them.
const PIN_DEFAULTS = {
    motorEn: "15",
    motorIn1: "13",
    motorIn2: "12",
    motorIn3: "14",
    motorIn4: "16",
    ledPin: "2",
    ledCount: "8",
};

document.getElementById("reset-pins-button").addEventListener("click", () => {
    for (const [id, value] of Object.entries(PIN_DEFAULTS)) {
        document.getElementById(id).value = value;
    }
    updatePinAssignments();
    validateAllPinFields();
});

function parseSettings(text) {
    const settings = {};
    text.split("\n").forEach(line => {
        line = line.trim();
        if (!line) return;
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) return;
        const key = line.substring(0, separatorIndex);
        const value = line.substring(separatorIndex + 1);
        settings[key] = value;
    });
    return settings;
}

function applySettingsToForm(settings) {
    for (const key in settings) {
        const value = settings[key];
        const elements = form.querySelectorAll(`[name="${key}"]`);
        if (elements.length === 0) continue;

        if (elements[0].type === "radio") {
            elements.forEach(element => {
                element.checked = (element.value === value);
            });
        } else {
            elements[0].value = value;
        }
    }
}

function loadSettings() {
    fetch("/api/settings")
        .then(response => response.text())
        .then(text => {
            applySettingsToForm(parseSettings(text));
            updateModeUI();
            updatePinAssignments();
            validateAllPinFields();
        })
        .catch(error => {
            console.log(error);
            statusMessage.textContent = translate("statusLoadFailed");
        });
}

function saveSettings(event) {
    event.preventDefault();

    validateAllPinFields();
    if (!form.reportValidity()) {
        statusMessage.textContent = translate("statusInvalidPins");
        return;
    }

    const params = new URLSearchParams(new FormData(form));

    statusMessage.textContent = translate("statusSaving");

    fetch("/api/settings/save", {
        method: "POST",
        body: params
    })
        .then(() => {
            statusMessage.textContent = translate("statusSavedRebooting");
        })
        .catch(() => {
            // The device restarts right after saving, so the request
            // failing/timing out here is expected, not an error.
            statusMessage.textContent = translate("statusSavedRebooting");
        });
}

form.addEventListener("submit", saveSettings);

loadSettings();
