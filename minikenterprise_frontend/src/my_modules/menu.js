export class Menu {
    constructor() {
        this.menuItems = [
            {id: 0, name: "Input", screen: "Input"},
            {id: 1, name: "Lights", screen: "Lights"}
        ];
        this.currentMenu = this.menuItems[0];
        this.active = false;
    }

    init(ledCallback,modeCallback,globalContext) {
        this.ledCallback = ledCallback;
        this.globalContext = globalContext;
        this.modeCallback = modeCallback;
        document.getElementById("SettingsButton").onclick = this.showPopupMenu;
        document.getElementById("SettingsBackButton").onclick = this.hidePopupMenu;

        this.setupSettingsNavigation();
    }

    setupSettingsNavigation() {
        let settingsNavigation = document.getElementById("settingsNavigation");

        this.menuItems.forEach(item => {
            let menuItem = document.createElement('button');
            menuItem.id = "MenuItem"+item.id+"Button";
            menuItem.className = "settingsTabButton";
            menuItem.innerHTML = item.name;
            menuItem.onclick = () => {
                this.currentMenu = item;
                this.highlightButton("MenuItem",item.id,this.menuItems.length);
                this.renderScreen();
            };
            settingsNavigation.appendChild(menuItem);
        });
        this.highlightButton("MenuItem",this.menuItems[0].id,this.menuItems.length);
        this.renderScreen();
    }

    renderInputScreen() {
        let screenArea = document.getElementById("settingsPage");
        screenArea.innerHTML = "";

        // --- Motor trim ---
        let trimSection = document.createElement("div");
        trimSection.className = "settingsSection";

        let trimLabel = document.createElement("div");
        trimLabel.className = "settingsSectionLabel";
        trimLabel.innerHTML = "Motor Trim (L/R)";

        let trimRow = document.createElement("div");
        trimRow.className = "trimRow";

        let trimLeftLabel = document.createElement("span");
        trimLeftLabel.className = "trimEndLabel";
        trimLeftLabel.innerHTML = "L";

        let trimSlider = document.createElement("input");
        trimSlider.type = "range";
        trimSlider.id = "TrimSlider";
        trimSlider.className = "trimSlider";
        trimSlider.min = "-100";
        trimSlider.max = "100";
        trimSlider.value = this.globalContext.trimValue ?? "0";

        let trimRightLabel = document.createElement("span");
        trimRightLabel.className = "trimEndLabel";
        trimRightLabel.innerHTML = "R";

        let trimReadout = document.createElement("div");
        trimReadout.id = "TrimValue";
        trimReadout.className = "trimReadout";

        let updateTrimReadout = (value) => {
            let numeric = Number(value);
            if(numeric === 0){
                trimReadout.innerHTML = "Centered";
            }
            else{
                trimReadout.innerHTML = Math.abs(numeric) + "% " + (numeric > 0 ? "Left" : "Right");
            }
        };

        // globalContext.trimValue is kept as the raw slider string (not parsed), matching how
        // backendCommunication.js's addTrimToSteering() already consumes it - only this screen's
        // own display logic needs a Number() for the sign/magnitude split above.
        trimSlider.oninput = () => {
            this.globalContext.trimValue = trimSlider.value;
            updateTrimReadout(trimSlider.value);
        };
        updateTrimReadout(trimSlider.value);

        trimRow.appendChild(trimLeftLabel);
        trimRow.appendChild(trimSlider);
        trimRow.appendChild(trimRightLabel);

        trimSection.appendChild(trimLabel);
        trimSection.appendChild(trimRow);
        trimSection.appendChild(trimReadout);

        // --- Control modes ---
        let modeSection = document.createElement("div");
        modeSection.className = "settingsSection";

        let modeLabel = document.createElement("div");
        modeLabel.className = "settingsSectionLabel";
        modeLabel.innerHTML = "Control Mode";

        // Index i matches setMode(i+1) in ui.js exactly (deadband/stickyness/rotation table) -
        // these labels are purely descriptive, the underlying modes 1-4 are unchanged.
        let modeDefinitions = [
            { title: "Arcade", subtitle: "Auto-Center Throttle + Steering" },
            { title: "Arcade", subtitle: "Sticky Throttle + Steering" },
            { title: "Tank Drive", subtitle: "Auto-Center L/R Throttles" },
            { title: "Tank Drive", subtitle: "Sticky L/R Throttles" }
        ];

        let modePanel = document.createElement("div");
        modePanel.id = "ModePanel";
        modeDefinitions.forEach((mode, i) => {
            let modeButton = document.createElement("button");
            modeButton.id = "Mode"+i+"Button";
            modeButton.className = "modeButton";
            modeButton.innerHTML = "<span class=\"modeButtonTitle\">"+mode.title+"</span><span class=\"modeButtonSubtitle\">"+mode.subtitle+"</span>";
            modeButton.onclick = () => {
                this.highlightButton("Mode",i,modeDefinitions.length);
                this.modeCallback(i+1);
            };
            modePanel.appendChild(modeButton);
        });

        modeSection.appendChild(modeLabel);
        modeSection.appendChild(modePanel);

        screenArea.appendChild(modeSection);
        screenArea.appendChild(trimSection);

        // Re-apply the highlight for whichever mode is already active - this screen's DOM gets
        // torn down and rebuilt every time you switch tabs, so without this, coming back to the
        // Input tab would show all four mode buttons as unselected even though one is really
        // active. globalContext.mode is set by setMode() in ui.js (defaults to 1, but init()
        // runs before that first setMode(1) call, hence the fallback).
        this.highlightButton("Mode", (this.globalContext.mode ?? 1) - 1, modeDefinitions.length);
    }

    renderLightsScreen() {
        let screenArea = document.getElementById("settingsPage");
        screenArea.innerHTML = "";

        let section = document.createElement("div");
        section.className = "settingsSection";

        let label = document.createElement("div");
        label.className = "settingsSectionLabel";
        label.innerHTML = "LED Effect";

        let pickerGroup = document.createElement("div");
        pickerGroup.className = "ledPickerGroup";

        let select = document.createElement("select");
        select.id = "LedModeSelect";
        select.innerHTML = '<option value="0">Solid Color</option><option value="1" selected="selected">Knight Rider</option><option value="2">Blinking</option><option value="3">Boat</option>';

        let colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.id = "LedColorPicker";
        colorPicker.value = "#fcca03";

        pickerGroup.appendChild(select);
        pickerGroup.appendChild(colorPicker);

        let sendButton = document.createElement("button");
        sendButton.id = "LedSendButton";
        sendButton.className = "ledUpdateButton";
        sendButton.innerHTML = "Update LEDs";
        sendButton.onclick = this.ledCallback;

        section.appendChild(label);
        section.appendChild(pickerGroup);
        section.appendChild(sendButton);

        screenArea.appendChild(section);
    }

    renderScreen() {
        switch(this.currentMenu.screen) {
            case "Lights":
                this.renderLightsScreen();
                break;
            case "Input":
                this.renderInputScreen();
                break;
            default:
                break;
        }
    }

    showPopupMenu() {
        document.getElementById("popupMenu").style.visibility = "visible";
        this.active = true;
    }

    hidePopupMenu() {
        document.getElementById("popupMenu").style.visibility = "hidden";
        this.active = false;
    }

    highlightButton(idPrefix,choosenOption,optionCount){
        for(var i = 0; i < optionCount; i++){
            document.getElementById(idPrefix+i+"Button").style.borderColor = (i==choosenOption) ? "rgb(255, 204, 0)" : "rgb(179, 178, 175)";
        }
    }
}

export default Menu;
