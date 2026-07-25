export class Menu {
    constructor() {
        this.menuItems = [
            {id: 0, name: "Lights", screen: "Lights"},
            {id: 1, name: "Input", screen: "Input"}
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

        let modePanel = document.createElement("div");
        modePanel.id = "ModePanel";
        for(let i = 0; i < 4; i++){
            let modeButton = document.createElement("button");
            modeButton.id = "Mode"+i+"Button";
            modeButton.innerHTML = "Mode "+i;
            modeButton.onclick = () => {
                this.highlightButton("Mode",i,4);
                this.modeCallback(i+1);
            };
            modePanel.appendChild(modeButton);
        }

        let trimSlider = document.createElement("input");
        trimSlider.type = "range";
        trimSlider.id = "TrimSlider";
        trimSlider.min = "-100";
        trimSlider.max = "100";
        trimSlider.value = "0";
        trimSlider.oninput = () => {
          let trimValue = document.getElementById("TrimValue");
          trimValue.innerHTML = trimSlider.value;
          this.globalContext.trimValue = trimSlider.value;
        };

        let trimValue = document.createElement("span");
        trimValue.id = "TrimValue";
        trimValue.innerHTML = trimSlider.value;

        let trimRow = document.createElement("div");
        trimRow.appendChild(trimSlider);
        trimRow.appendChild(trimValue);

        screenArea.appendChild(trimRow);
        screenArea.appendChild(modePanel);
    }
        
    renderLightsScreen() {
        let screenArea = document.getElementById("settingsPage");
        screenArea.innerHTML = "";

        let select = document.createElement("select");
        select.id = "LedModeSelect";
        select.innerHTML = '<option value="0">Solid Color</option><option value="1" selected="selected">Knight Rider</option><option value="2">Blinking</option><option value="3">Boat</option>';

        let sendButton = document.createElement("button");
        sendButton.id = "LedSendButton";
        sendButton.innerHTML = "Update LEDs";
        sendButton.onclick = this.ledCallback;
        
        let colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.id = "LedColorPicker";
        colorPicker.value = "#fcca03";

        screenArea.appendChild(select);
        screenArea.appendChild(sendButton);
        screenArea.appendChild(colorPicker);
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
      console.log("Highlighting button");
      console.log(idPrefix);
      console.log(choosenOption);
        for(var i = 0; i < optionCount; i++){
            var elementId = idPrefix+i+"Button";
            console.log(elementId);
            document.getElementById(elementId).style.borderColor = (i==choosenOption) ? "rgb(255, 204, 0)" : "rgb(179, 178, 175)";
        }
    }
/*
    highlightModeButton(newMode){
        for(var i = 1; i <= 4; i++){
          document.getElementById("Mode"+i+"Button").style.borderColor = (i==newMode) ? "rgb(255, 204, 0)" : "rgb(179, 178, 175)";
        }
    }*/
}

export default Menu;

/*
LED Settings
<div id="LedPanel">
  <div id="LedControlsGrid">
      <div id="Spacer" ></div>
      <select id="LedModeSelect" >
          <option value="0">Solid Color</option>
          <option value="1" selected="selected">Knight Rider</option>
          <option value="2">Blinking</option>
          <option value="3">Boat</option>
        </select>
        <button type="button" id="LedSendButton">Update LEDs</button>
      <input type="color" id="LedColorPicker" value="#fcca03">
  </div>
</div>
<div id="Motor Settings">
<select id="Motor Driver Type" >
  <option value="0">H-Bridge</option>
  <option value="1">ESC</option>
</select>
<input type="number" id="MotorPin1" value="0">
<input type="number" id="MotorPin2" value="0">

</div>
Input Settings
<div id="ModePanel">
<button type="button" id="Mode1Button">Mode 1</button>
<button type="button" id="Mode2Button">Mode 2</button>
<button type="button" id="Mode3Button">Mode 3</button>
<button type="button" id="Mode4Button">Mode 4</button>
</div></input>v*/