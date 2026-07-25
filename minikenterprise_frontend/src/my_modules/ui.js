import { Joystick } from "./joystick";
import globalContext from "./dataBuffer";
import { Menu } from "./menu";

var my_menu = new Menu();

export function initUi(sendLedDataCallback,globalContext){
  scaleItems();
  my_menu.init(sendLedDataCallback,setMode,globalContext);
  setupJoysticks();
  setupBoostButton();

  setMode(1);

  // Neither event alone is fully reliable: 'resize' doesn't fire on every iOS rotation in a
  // timely way, and immediately after 'orientationchange' iOS can briefly report stale
  // window.innerWidth/innerHeight values (settling a moment later) - the short delay covers that.
  window.addEventListener('resize', scaleItems);
  window.addEventListener('orientationchange', () => setTimeout(scaleItems, 100));
}

export function resetControls(){
  globalContext.leftJoystick.reset();
  globalContext.rightJoystick.reset();
}

function scaleItems(){
  var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
  console.log("Width: "+width);
  var joystickWidth = width * 0.22;
  setJoystickSize("LeftJoystick",joystickWidth);
  setJoystickSize("RightJoystick",joystickWidth);

  // On the very first call (from initUi, before setupJoysticks has run) these don't exist yet -
  // setJoystickSize above already sized the canvases correctly for that initial render.
  if(globalContext.leftJoystick){
    globalContext.leftJoystick.resize();
  }
  if(globalContext.rightJoystick){
    globalContext.rightJoystick.resize();
  }
}

function setJoystickSize(name,size){
  document.getElementById(name+"Container").style.width = size+20;
  document.getElementById(name+"Container").style.height = size+20
  document.getElementById(name+"Base").width = size;
  document.getElementById(name+"Base").height = size;
  document.getElementById(name).width = size;
  document.getElementById(name).height = size;
}

function setupJoysticks(){
  globalContext.leftJoystick = new Joystick("LeftJoystick",false);
  globalContext.rightJoystick = new Joystick("RightJoystick",false);

  /*document.getElementById("Mode1Button").addEventListener("click", e => setMode(1) );
  document.getElementById("Mode2Button").addEventListener("click", e => setMode(2) );
  document.getElementById("Mode3Button").addEventListener("click", e => setMode(3) );
  document.getElementById("Mode4Button").addEventListener("click", e => setMode(4) );*/
}

// Boost is a press-and-hold signal to the firmware (globalContext.boostRequested), which is
// only meaningful while the firmware's own boost state machine is BOOST_READY - the button's
// disabled attribute (toggled by updateBoostButton() from the server-authoritative Status
// message) already blocks presses during an active boost/cooldown, so no local state-guarding
// is needed here. Mirrors joystick.js's mousedown/touchstart press-tracking pattern.
function setupBoostButton(){
  var button = document.getElementById("BoostButton");

  var press = () => { globalContext.boostRequested = true; };
  var release = () => { globalContext.boostRequested = false; };

  button.addEventListener('mousedown', press);
  button.addEventListener('mouseup', release);
  button.addEventListener('mouseleave', release);

  button.addEventListener('touchstart', event => { event.preventDefault(); press(); }, { passive: false });
  button.addEventListener('touchend', event => { event.preventDefault(); release(); }, { passive: false });
}

  function toggleVisibility(elementId){
    var value = document.getElementById(elementId).style.visibility;
  
    var newStyle = "visible";
    if(value == "visible"){
      newStyle = "hidden";
    }
  
    document.getElementById(elementId).style.visibility = newStyle;
  }

  //Status Icon Functions
var statusData =[
  {
    name:"Battery",
    indexId: "BatterySymbol",
    icons:["bi:battery","bi:battery-half","bi:battery-full"],
    critical:false
  },
  {
    name:"Network",
    indexId: "NetworkSymbol",
    icons:["bi:wifi-1","bi:wifi-2","bi:wifi"],
    critical:false
  }
];

var statusColors = ["rgb(255, 0, 0)","rgb(255, 153, 51)","rgb(0, 204, 0)"];

export function percentageToIcon(percentage,parameterName){
  var newIconName = "";
  var newColor = "";
  var visibility = "";
  var parameterId = statusData.findIndex(x => x.name === parameterName);
  var elementId = statusData[parameterId].indexId;

  if(percentage > 60){
    newIconName = statusData[parameterId].icons[2];
    statusData[parameterId].critical=false;
    visibility = "visible";
    newColor = statusColors[2];
  }
  else if( (percentage > 20) && (percentage <= 60) ){
    newIconName = statusData[parameterId].icons[1];
    statusData[parameterId].critical=false;
    visibility = "visible";
    newColor = statusColors[1];
  }
  else{
    newIconName = statusData[parameterId].icons[0];
    statusData[parameterId].critical=true;
    visibility = document.getElementById(elementId).style.visibility;
    newColor = statusColors[0];
  }
  
  document.getElementById(elementId).setAttribute('data-icon', newIconName);
  document.getElementById(elementId).style.visibility = visibility;
  document.getElementById(elementId).style.color = newColor;
}

function updateStatuIcons(){
  for(var i = 0; i < 2; i++){
    if(statusData[i].critical){
      toggleVisibility(statusData[i].indexId);
    }
  }
}

export function showErrorMessage(){
  document.getElementById("popupError").style.visibility = "visible";
  // Reset visual state in case this popup was left mid-countdown/escalated from a previous
  // offline episode - each new episode should start fresh.
  document.getElementById("reconnectProgressFill").style.width = "100%";
  document.getElementById("reconnectEscalationText").hidden = true;
}

export function hideErrorMessage(){
  document.getElementById("popupError").style.visibility = "hidden";
}

/**
 * Renders the live reconnect countdown/attempt-count text and progress bar, and reveals the
 * escalation hint once the caller decides enough attempts have failed. main.js owns the actual
 * timing/attempt-count state (and the escalation threshold) - this just renders whatever it's
 * given.
 */
export function updateReconnectStatus(secondsLeft, attemptCount, reconnectIntervalSeconds, escalate){
  document.getElementById("reconnectStatusText").innerHTML =
    "Trying to row back to you in " + secondsLeft + "s... (attempt " + attemptCount + ")";

  var progressPercent = (secondsLeft / reconnectIntervalSeconds) * 100;
  document.getElementById("reconnectProgressFill").style.width = progressPercent + "%";

  document.getElementById("reconnectEscalationText").hidden = !escalate;
}

// Boost state codes, matching PropulsionSystem.h's BoostState enum on the firmware side.
var BOOST_READY = 0;
var BOOST_ACTIVE = 1;

/**
 * Renders the boost button's ready/active/cooldown state. The firmware is the sole timing
 * authority (PropulsionSystem's boost state machine) - this just renders whatever state/
 * secondsRemaining the latest Status message reported, the same pattern as
 * updateReconnectStatus() above.
 *
 * Solid yellow when ready to press, flashing yellow while boost is active, flashing gray
 * (much slower) during the cooldown that follows.
 */
export function updateBoostButton(state, secondsRemaining){
  var button = document.getElementById("BoostButton");
  var overlay = document.getElementById("BoostCountdown");

  var isReady = (state === BOOST_READY);
  var isActive = (state === BOOST_ACTIVE);

  button.disabled = !isReady;
  button.classList.toggle("boostReady", isReady);
  button.classList.toggle("boostActive", isActive);
  button.classList.toggle("boostCooldown", !isReady && !isActive);
  overlay.textContent = isReady ? "" : (secondsRemaining + "s");
}

//Settings functions
export function showPopupMenu() {
  toggleVisibility("popupMenu");
  renderMenu();
  }

function setMode(newMode){
  globalContext.mode = newMode;
  //highlightModeButton(newMode);

  if(newMode == 1 || newMode == 2){
    globalContext.leftJoystick.setDeadband(25);
    globalContext.rightJoystick.setDeadband(0);
    globalContext.rightJoystick.setRotation(true); //left right steering  
    if(newMode == 1){
      globalContext.leftJoystick.setStickyness(false);
    }
    else{
      globalContext.leftJoystick.setStickyness(true);
    }
  }
  else if(newMode == 3 || newMode == 4){
    globalContext.leftJoystick.setDeadband(25);
    globalContext.rightJoystick.setDeadband(25);
    globalContext.rightJoystick.setRotation(false);
    if(newMode == 3){
      globalContext.leftJoystick.setStickyness(false);
      globalContext.rightJoystick.setStickyness(false);
    }
    else{
      globalContext.leftJoystick.setStickyness(true);
      globalContext.rightJoystick.setStickyness(true);
    }
  }
  
}