const form = document.getElementById("settings-form");
const statusMessage = document.getElementById("status-message");

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
        .then(text => applySettingsToForm(parseSettings(text)))
        .catch(error => {
            console.log(error);
            statusMessage.textContent = "Failed to load settings.";
        });
}

function saveSettings(event) {
    event.preventDefault();

    const params = new URLSearchParams(new FormData(form));

    statusMessage.textContent = "Saving...";

    fetch("/api/settings/save", {
        method: "POST",
        body: params
    })
        .then(() => {
            statusMessage.textContent = "Saved, rebooting...";
        })
        .catch(() => {
            // The device restarts right after saving, so the request
            // failing/timing out here is expected, not an error.
            statusMessage.textContent = "Saved, rebooting...";
        });
}

form.addEventListener("submit", saveSettings);

loadSettings();
