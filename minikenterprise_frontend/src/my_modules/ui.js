import { Joystick } from "./joystick";
import globalContext from "./dataBuffer";
import { Menu } from "./menu";

var my_menu = new Menu();

export function initUi(sendLedDataCallback,globalContext){
  scaleItems();
  my_menu.init(sendLedDataCallback,setMode,globalContext);
  setupJoysticks();

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
}

export function hideErrorMessage(){
  document.getElementById("popupError").style.visibility = "hidden";
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