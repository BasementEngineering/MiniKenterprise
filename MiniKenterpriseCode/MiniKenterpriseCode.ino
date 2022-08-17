#include "Config.h"
#include "PropulsionSystem.h"
#include "LightBar.h"
#include "Battery.h"
#include "Wifi.h"
#include "FrontendServer.h"
#include "Parser.h"

PropulsionSystem propulsionSystem(MOTOR_EN,MOTOR_IN1,MOTOR_IN2,MOTOR_IN3,MOTOR_IN4);
LightBar lightBar(LED_COUNT, LED_PIN);

enum State{
  WIFI_STARTING,
  WAITING_FOR_WIFI_CLIENT,
  WAITING_FOR_FRONTEND,
  WORKING,
  CONNECTION_JUST_FAILED
 };

 State state = WIFI_STARTING;

//helper function decalarations (full implementations are further down)
void switchFrontendServer();

void setup(){
  Serial.begin(9600);
  Serial.println("Starting Setup");
  propulsionSystem.initPins();
  Battery_init();
  lightBar.initLeds();
  lightBar.setMode(BLINKING);
  //lightBar.update()

  Serial.println("Starting Backend");
  Parser_setup(motorCallback,ledCallback);
  Parser_init();
  Serial.println("Ready");
}

void loop(){
  updateHardware();
  FrontendServer_update();
  Parser_update();
  
  if(Battery_isCritical()){

  }

  if(Parser_online()){
   refreshStatus();
  }
  
  runStateMachine();
}

//STATE MAchines
void runStateMachine(){
  switch(state){
    case WIFI_STARTING:
      Wifi_setupAp();
      if(Wifi_online()){
        FrontendServer_init();
        state = WAITING_FOR_WIFI_CLIENT;
        showStatus(state);
        Serial.println(state);
      }
      break;
    case WAITING_FOR_WIFI_CLIENT:
      if(Wifi_hasClient()){
        setTimeout(60000);
        state = WAITING_FOR_FRONTEND;
        showStatus(state);
        Serial.println(state);
      }

      if( timoutDone() ){
          ESP.restart();
      }
      break;
    case WAITING_FOR_FRONTEND:
      if(Parser_online()){
        Serial.println("Parser online");
        //FrontendServer_stop();
        resetTimeout();
        state = WORKING;
        showStatus(state);
        Serial.println(state);
      }
      if(!Wifi_hasClient()){
        Serial.println("Wifi has no client");
        FrontendServer_start();
        state = WAITING_FOR_WIFI_CLIENT;
        showStatus(state);
        Serial.println(state);
      }
      break;
    case WORKING:
      if(!Parser_online()){
        setTimeout(60000);
        state = WAITING_FOR_FRONTEND;
        showStatus(state);
        Serial.println(state);
      }
      break;
    default:
      break;
}
Serial.print("currentState:");Serial.println(state);
}

void showStatus(int stateCode){
  switch(stateCode){
    case WIFI_STARTING:
      lightBar.setMainColor(0,0,255);
      lightBar.setMode(BLINKING);
      break;
    case WAITING_FOR_WIFI_CLIENT:
      lightBar.setMainColor(0,0,255);
      lightBar.setMode(BLINKING);
      break;
    case WAITING_FOR_FRONTEND:
      lightBar.setMainColor(0,200,000);
      lightBar.setMode(BLINKING);
      Serial.println("Setting Blinking 200 2000");
      break;
    case WORKING:
      lightBar.setMainColor(YELLOW);
      lightBar.setMode(KNIGHT_RIDER);
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
  Battery_update();
  lightBar.update();
  yield();
}

void ledCallback(Command command){
  Serial.println("LED Callback");
}

void motorCallback(Command command){
  Serial.println("Movement callback");
  Serial.println("command.id");
  Serial.println(command.id);
  switch(command.id){
    default: 
    Serial.println("in switch");
    break;
  }
}

unsigned long lastStatusUpdate = 0;
void refreshStatus(){
  if( (millis() - lastStatusUpdate) > 100){
    lastStatusUpdate = millis();
    Command command;
    command.id = Status;
    command.parameterCount = 2;
    command.parameters[0] = Battery_getPercentage();
    command.parameters[1] = Wifi_getQualityPercentage();
    Parser_sendCommand(command);
  }
}
