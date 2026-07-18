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
        })
        .catch(error => {
            console.log(error);
            statusMessage.textContent = translate("statusLoadFailed");
        });
}

function saveSettings(event) {
    event.preventDefault();

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
