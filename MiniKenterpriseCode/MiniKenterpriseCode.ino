#include "Config.h"
#include "Settings.h"
#include "PropulsionSystem.h"
#include "RudderPropulsion.h"
#include "LightBar.h"
#include "Battery.h"
#include "Wifi.h"
#include "FrontendServer.h"
#include "Parser.h"

// Constructed in setup(), once Settings_load() has read the pin assignments -
// global objects can't take these as constructor args since Settings isn't
// loaded yet when global initializers run.
//
// RudderPropulsion (rudder-steered boat variant, from origin/main) is included
// above but not yet wired in here - it assumes a compile-time pin scheme this
// firmware doesn't use anymore (pins are runtime-configurable via Settings).
// Revisit if/when rudder steering becomes a selectable Settings-driven mode.
PropulsionSystem* propulsionSystem;
LightBar* lightBar;

enum State{
  STARTING_WIFI,
  WAITING_FOR_WIFI_CLIENT,
  WAITING_FOR_FRONTEND,
  WORKING
 };

 State state = STARTING_WIFI;

//helper function decalarations (full implementations are further down)
void switchState(State newState){
  Serial.println("Switching state ");
  Serial.print(state);Serial.print(" to ");Serial.println(newState);
  if(newState != WORKING){
    propulsionSystem->stop();
  }
  if(newState == STARTING_WIFI){
    // Always start a fresh Station-connect attempt here - covers the initial boot attempt,
    // losing an established Station connection, and the periodic retry from AP mode below.
    Wifi_resetStationAttempt();
  }
  state = newState;
  showStatus(state);
}

void setup(){
  Serial.setDebugOutput(true);
  Serial.begin(115200);
  Serial.println("Starting Setup");
  Settings_load();
  Serial.println("Motor pins: en=" + String(settings.motorEn) + " in1=" + String(settings.motorIn1) + " in2=" + String(settings.motorIn2) + " in3=" + String(settings.motorIn3) + " in4=" + String(settings.motorIn4));
  propulsionSystem = new PropulsionSystem(settings.motorEn, settings.motorIn1, settings.motorIn2, settings.motorIn3, settings.motorIn4);
  lightBar = new LightBar(settings.ledCount);
  // Battery_init() must run before propulsionSystem->initPins() - initPins() does the first
  // PWM-limit-band lookup (see PropulsionSystem::getCurrentPwmLimitBand()) using the no-load
  // voltage reading immediately, which Battery_init() is what seeds with a real sample.
  Battery_init();
  propulsionSystem->initPins();
  lightBar->initLeds();
  lightBar->setMode(SOLID);
  lightBar->setMainColor(200,50,0);
  Wifi_setup();
  lightBar->setMode(BLINKING);
  //lightBar.update()

  Serial.println("Starting Backend");
  Parser_setup(motorCallback,ledCallback);
  Parser_init();
  Serial.println("Ready");
}

void loop(){
  updateHardware();
  Wifi_update();
  FrontendServer_update();
  Parser_update();

  if(Battery_isCritical()){

  }

  if(Parser_online()){
   refreshStatus();
  }

  runStateMachine();
  checkWifiWedge();
  logDiagnostics();
}

// --- WiFi/AP wedge watchdog ---
// Observed in the field: the soft-AP can silently stop broadcasting (it vanishes from a phone's
// WiFi scan) while the rest of the firmware keeps running normally (state machine, LEDs, main
// loop all unaffected) - the crash is isolated to the WiFi/RF subsystem. Re-calling
// WiFi.softAP()/WiFi.begin() from software doesn't reliably clear whatever internal state caused
// that, so once we've had a working connection and it doesn't come back within a generous grace
// period, a full restart is the only recovery that's actually reachable for a boat out on the
// water (nobody's there to power-cycle it by hand).
#define WIFI_WEDGE_RESTART_TIMEOUT 90000
bool everHadWifiClient = false;
unsigned long lastWifiClientTime = 0;

void checkWifiWedge(){
  if(Wifi_connected()){
    everHadWifiClient = true;
    lastWifiClientTime = millis();
  }
  else if(everHadWifiClient && (millis() - lastWifiClientTime) > WIFI_WEDGE_RESTART_TIMEOUT){
    Serial.println("No WiFi client for " + String(WIFI_WEDGE_RESTART_TIMEOUT/1000) + "s after a previous connection - restarting (possible AP/radio hang)");
    propulsionSystem->stop();
    ESP.restart();
  }
}

// --- Heap diagnostics ---
// Logged periodically over Serial so a bench/tethered test run can show whether heap
// fragmentation builds up over a session - a candidate contributor to the same WiFi/AP
// instability, alongside the NeoPixel interrupt-blackout issue above.
#define DIAGNOSTICS_LOG_INTERVAL 5000
unsigned long lastDiagnosticsLog = 0;

void logDiagnostics(){
  if( (millis() - lastDiagnosticsLog) > DIAGNOSTICS_LOG_INTERVAL){
    lastDiagnosticsLog = millis();
    Serial.print("Heap: free=");
    Serial.print(ESP.getFreeHeap());
    Serial.print(" maxFreeBlock=");
    Serial.print(ESP.getMaxFreeBlockSize());
    Serial.print(" fragmentation=");
    Serial.print(ESP.getHeapFragmentation());
    Serial.println("%");
  }
}

//STATE MAchines
void runStateMachine(){
  // Running AP mode only as a fallback (the user actually wants Station mode) - periodically
  // check whether the home network is reachable again, as long as nobody is currently
  // connected/driving through the AP. Skipped while already (re-)attempting Station mode.
  if(state != STARTING_WIFI && Wifi_shouldRetryStation()){
    Serial.println("Retrying Station mode after fallback to AP");
    switchState(STARTING_WIFI);
  }

  switch(state){
    case STARTING_WIFI:
      Wifi_start();
      if(Wifi_online()){
        FrontendServer_init();
        switchState(WAITING_FOR_WIFI_CLIENT);
      }
      break;
    case WAITING_FOR_WIFI_CLIENT:
      if(Wifi_connected()){
        Serial.println("Wifi is connected");
        setTimeout(100000);
        Serial.println("SetTimeout done");
        switchState(WAITING_FOR_FRONTEND);
      }
      if( timoutDone() ){
          Serial.println("Restarting");
          ESP.restart();
      }
      //Serial.println("Waiting for wifi client doen");
      break;
    case WAITING_FOR_FRONTEND:
      if(Parser_online()){
        //FrontendServer_stop();
        resetTimeout();
        switchState(WORKING);
      }
      if(!Wifi_connected()){
        FrontendServer_start();
        //switchState(WAITING_FOR_WIFI_CLIENT);
        switchState(STARTING_WIFI);
      }
      break;
    case WORKING:
      if(!Parser_online()){
        setTimeout(30000);
        switchState(WAITING_FOR_FRONTEND);
      }
      break;
    default:
      break;
}
}

void showStatus(int stateCode){
  switch(stateCode){
    case STARTING_WIFI:
    case WAITING_FOR_WIFI_CLIENT:
      // Blue = trying to join/connected to the home network (Station mode).
      // Magenta = broadcasting the boat's own network (AP mode, whether by choice or
      // fallback) - lets you tell at a glance which network to look for on your phone.
      if(Wifi_isApMode()){
        lightBar->setMainColor(200,0,200);
      }
      else{
        lightBar->setMainColor(0,0,255);
      }
      lightBar->setMode(BLINKING);
      break;
    case WAITING_FOR_FRONTEND:
      lightBar->setMainColor(0,200,000);
      lightBar->setMode(BLINKING);
      break;
    case WORKING:
      lightBar->setMainColor(YELLOW);
      lightBar->setMode(KNIGHT_RIDER);
      break;
    default:
      break;
  }
}

//Timeout helpers
unsigned long timeout = 0;
bool timerActive = false;
unsigned long timeoutStart = 0;

void setTimeout(unsigned long maxValue){
  timerActive = true;
  timeout = maxValue;
  timeoutStart = millis();
}

void resetTimeout(){
  timerActive = false;
}

bool timoutDone(){
  if(timerActive){
    if( (millis() - timeoutStart) > timeout){
      timerActive = false;
      return true;
    }
  }
  return false;
}


//Regular Update helpers
void updateHardware(){
  Battery_update(propulsionSystem->isIdle());
  lightBar->update();
  propulsionSystem->update();
  yield();
}

void motorCallback(Command command){
  //Serial.println("Movement callback");
  //Serial.println("command.id");
  //Serial.println(command.id);
  int leftSpeed = 0;
  int rightSpeed = 0;
  
  switch(command.id){
    case ControlLR:
      leftSpeed = command.parameters[0];
      rightSpeed = command.parameters[1];
      propulsionSystem->moveLeft(leftSpeed);
      propulsionSystem->moveRight(rightSpeed);
      break;
    case ControlSD:
      propulsionSystem->setSpeed(command.parameters[0]);
      propulsionSystem->setDirection(command.parameters[1]);
      break;
    default:
    //Serial.println("in switch");
    break;
  }

  // Boost-requested flag, appended as a 3rd parameter to the periodic ControlLR/ControlSD
  // command - guarded by parameterCount so older frontend builds that don't send it are
  // unaffected. Applies regardless of which command id carried it (both funnel through here).
  if(command.parameterCount > 2 && command.parameters[2] == 1){
    propulsionSystem->requestBoost();
  }
}

void ledCallback(Command command){
  //Serial.println("LED Callback");
  if(command.parameterCount == 4){
    lightBar->setMode(command.parameters[0]);
    lightBar->setMainColor(command.parameters[1],command.parameters[2],command.parameters[3]);
  }
}

unsigned long lastStatusUpdate = 0;
void refreshStatus(){
  if( (millis() - lastStatusUpdate) > 100){
    lastStatusUpdate = millis();
    Command command;
    command.id = Status;
    command.parameterCount = 6;
    command.parameters[0] = Battery_getPercentage();
    command.parameters[1] = Wifi_getQualityPercentage();
    command.parameters[2] = Battery_getVoltageMv();
    command.parameters[3] = propulsionSystem->getBoostState();
    command.parameters[4] = propulsionSystem->getBoostSecondsRemaining();
    command.parameters[5] = Battery_getNoLoadVoltageMv();
    Parser_sendCommand(command);
  }
}
