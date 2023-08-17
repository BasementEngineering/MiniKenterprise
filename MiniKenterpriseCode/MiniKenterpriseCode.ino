#include "Config.h"
#include "PropulsionSystem.h"
#include "RudderPropulsion.h"
#include "LightBar.h"
#include "Battery.h"
#include "Wifi.h"
#include "FrontendServer.h"
#include "Parser.h"

#ifdef RUDDER_STEERING
RudderPropulsion propulsionSystem(MOTOR_EN,MOTOR_IN1,MOTOR_IN2,MOTOR_IN3);
#else
PropulsionSystem propulsionSystem(MOTOR_EN,MOTOR_IN1,MOTOR_IN2,MOTOR_IN3,MOTOR_IN4);
#endif
LightBar lightBar(LED_COUNT, LED_PIN);

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
    propulsionSystem.stop();
  }
  state = newState;
  showStatus(state);
}

void setup(){
  Serial.setDebugOutput(true);
  Serial.begin(115200);
  Serial.println("Starting Setup");
  propulsionSystem.initPins();
  Battery_init();
  lightBar.initLeds();
  lightBar.setMode(SOLID);
  lightBar.setMainColor(200,50,0);
  Wifi_setup();
  lightBar.setMode(BLINKING);
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
}

//STATE MAchines
void runStateMachine(){
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
        switchState(WAITING_FOR_FRONTEND);
      }
      if( timoutDone() ){
          Serial.println("Restarting");
          ESP.restart();
      }
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
      propulsionSystem.moveLeft(leftSpeed);
      propulsionSystem.moveRight(rightSpeed);
      break;
    case ControlSD:
      propulsionSystem.setSpeed(command.parameters[0]);
      propulsionSystem.setDirection(-command.parameters[1]);
      break;
    default: 
    //Serial.println("in switch");
    break;
  }
}

void ledCallback(Command command){
  //Serial.println("LED Callback");
  if(command.parameterCount == 4){
    lightBar.setMode(command.parameters[0]);
    lightBar.setMainColor(command.parameters[1],command.parameters[2],command.parameters[3]);
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
