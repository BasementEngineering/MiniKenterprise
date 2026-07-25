const STORAGE_KEY = "mke-settings-lang";

const translations = {
    en: {
        backButton: "← Back",
        pageTitle: "Settings",
        wifiHeading: "WiFi",
        apModeSwitchLabel: "Access Point",
        staModeSwitchLabel: "Station",
        apFallbackNote: " (fallback)",
        apModeExplanation: "Your phone connects straight to the boat's own WiFi network - no router needed. Best when you're away from home, with no WiFi around.",
        staModeExplanation: "The boat joins your existing WiFi network, so your phone reaches it through your router. Handy for testing at home, but keeps the boat within that network's range.",
        apSettingsHeading: "Access Point Settings",
        apSsidLabel: "Boat WiFi Name (AP Mode)",
        apPasswordLabel: "Boat WiFi Password (AP Mode)",
        staSettingsHeading: "Station Settings",
        staSsidLabel: "WiFi Network Name (Station Mode)",
        staPasswordLabel: "WiFi Network Password (Station Mode)",
        pinsHeading: "Pins",
        pinoutCaption: "D-pin silkscreen label → GPIO number. Use the GPIO number in the fields below.",
        pinoutReservedNote: "D3 / GPIO0 is used for flashing, D4 / GPIO2 drives the LED strip – avoid assigning either",
        motorEnLabel: "Motor Enable Pin",
        motorIn1Label: "Motor In1 Pin",
        motorIn2Label: "Motor In2 Pin",
        motorIn3Label: "Motor In3 Pin",
        motorIn4Label: "Motor In4 Pin",
        ledCountLabel: "LED Count",
        resetPinsButton: "Reset Pins to Defaults",
        pinValidationMessage: "Not a GPIO pin on this board - see the pinout diagram above.",
        saveButton: "Save",
        ssidPlaceholder: "ssid",
        passwordPlaceholder: "password",
        statusLoadFailed: "Failed to load settings.",
        statusSaving: "Saving...",
        statusSavedRebooting: "Saved, rebooting...",
        statusInvalidPins: "Fix the highlighted Pin fields before saving.",
    },
    de: {
        backButton: "← Zurück",
        pageTitle: "Einstellungen",
        wifiHeading: "WLAN",
        apModeSwitchLabel: "Access Point",
        staModeSwitchLabel: "Station",
        apFallbackNote: " (Fallback)",
        apModeExplanation: "Dein Handy verbindet sich direkt mit dem eigenen WLAN des Boots - kein Router nötig. Am besten geeignet, wenn kein WLAN in der Nähe ist.",
        staModeExplanation: "Das Boot verbindet sich mit deinem bestehenden WLAN, sodass dein Handy über deinen Router mit ihm spricht. Praktisch zum Testen zu Hause, bindet das Boot aber an die Reichweite dieses Netzwerks.",
        apSettingsHeading: "Access-Point-Einstellungen",
        apSsidLabel: "Boot-WLAN Name (AP-Modus)",
        apPasswordLabel: "Boot-WLAN Passwort (AP-Modus)",
        staSettingsHeading: "Stationseinstellungen",
        staSsidLabel: "WLAN-Netzwerk Name (Stationsmodus)",
        staPasswordLabel: "WLAN-Netzwerk Passwort (Stationsmodus)",
        pinsHeading: "Pins",
        pinoutCaption: "D-Pin-Aufdruck → GPIO-Nummer. Die GPIO-Nummer in die Felder unten eintragen.",
        pinoutReservedNote: "D3 / GPIO0 wird zum Flashen verwendet, D4 / GPIO2 steuert den LED-Streifen – keinen der beiden belegen",
        motorEnLabel: "Motor-Enable-Pin",
        motorIn1Label: "Motor-In1-Pin",
        motorIn2Label: "Motor-In2-Pin",
        motorIn3Label: "Motor-In3-Pin",
        motorIn4Label: "Motor-In4-Pin",
        ledCountLabel: "LED-Anzahl",
        resetPinsButton: "Pins auf Standardwerte zurücksetzen",
        pinValidationMessage: "Kein GPIO-Pin auf diesem Board - siehe Pinout-Diagramm oben.",
        saveButton: "Speichern",
        ssidPlaceholder: "ssid",
        passwordPlaceholder: "Passwort",
        statusLoadFailed: "Einstellungen konnten nicht geladen werden.",
        statusSaving: "Speichern...",
        statusSavedRebooting: "Gespeichert, Neustart läuft...",
        statusInvalidPins: "Bitte die markierten Pin-Felder vor dem Speichern korrigieren.",
    },
};

function currentLanguage() {
    return localStorage.getItem(STORAGE_KEY) || "en";
}

function translate(key) {
    const lang = currentLanguage();
    return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

function applyLanguage(lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        if (translations[lang][key]) element.textContent = translations[lang][key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        if (translations[lang][key]) element.placeholder = translations[lang][key];
    });

    const toggleButton = document.getElementById("lang-toggle");
    if (toggleButton) toggleButton.textContent = lang === "en" ? "DE" : "EN";
}

function setLanguage(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);
}

const toggleButton = document.getElementById("lang-toggle");
if (toggleButton) {
    toggleButton.addEventListener("click", () => {
        setLanguage(currentLanguage() === "en" ? "de" : "en");
    });
}

applyLanguage(currentLanguage());

export { translate };
