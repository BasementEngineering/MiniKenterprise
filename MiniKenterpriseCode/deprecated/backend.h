/*
 * The "backend" features all of the logic. 
 * It parses input from the frontend aka. the website running on the connected device 
 * and controls the propulsion system and the leds accordingly.
 */


#include <WebSocketsServer.h>

#include "PropulsionSystem.h"
#include "LightBar.h"

#define DEBUG
#define TIMEOUT 2000

//#define DEBUG_BACKEND

int connectionCount = 0;
bool timedOut = false;
unsigned long lastHeartbeat = 0;
unsigned long lastVoltageUpdate = 0;


WebSocketsServer socketServer = WebSocketsServer(81);

//Pointers to things that the backend will have access to during runtime
PropulsionSystem* myPropulsionPointer = NULL;
LightBar* myLightBar = NULL;

/*** Function Prototypes ***/
//Main Functions
void setupBackend(PropulsionSystem* pointer, LightBar* ledPointer);
void updateBackend();
void parseInput(String input);
void updateVoltage();
//helpers
void checkTimeout();
//... for serving files (such as our frontend website)
String getContentType(String filename);
bool handleFileRead(String path);
//...for settingup our websocket connection
void startWebsocket();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght);

String getSplitString(String data, char separator, int index);


/***           ***/

void setupBackend(PropulsionSystem* pointer, LightBar* ledPointer) {
  myPropulsionPointer = pointer;
  myLightBar = ledPointer;

  startWebsocket();
}

void checkTimeout(){
  if(!timedOut){
    
  if( (( millis() - lastHeartbeat ) > TIMEOUT ) && (connectionCount > 0)){
    timedOut=true;
  }
  if(timedOut){
    #ifdef DEBUG_BACKEND
    Serial.println("Timed Out");
    #endif
    myPropulsionPointer->stop();
  }
  
  }
}

void updateBackend(){
  socketServer.loop();
  checkTimeout();
  updateVoltage();
}

void parseInput(String input){
  #ifdef DEBUG_BACKEND
  Serial.println("Parsing: ");
  Serial.println(input);
  #endif

  char command = input.charAt(0);
  input.remove(0,2);
  int value = input.toInt();

  if(command == 'L'){
    lastHeartbeat = millis();
    int pwmSpeed = (int)(((float)value/100)*255);
    myPropulsionPointer->moveLeft(pwmSpeed);
  }
  else if(command == 'R'){
    lastHeartbeat = millis();
    int pwmSpeed = (int)(((float)value/100)*255);
    myPropulsionPointer->moveRight(pwmSpeed);
  }
  else if(command == 'D'){
    #ifdef DEBUG_BACKEND
    Serial.println("Direction: ");
    Serial.println(value);
    #endif
    myPropulsionPointer->setDirection(value);
  }
  else if(command == 'S'){
    #ifdef DEBUG_BACKEND
    Serial.println("Speed: ");
    Serial.println(value);
    #endif
    myPropulsionPointer->setSpeed(value);
  }
  else if(command == 'H'){
    lastHeartbeat = millis();
    timedOut = false;
  }
  else if(command == 'C'){
    lastHeartbeat = millis();
    int red = getSplitString(input, ' ',0).toInt();
    int green = getSplitString(input, ' ',1).toInt();
    int blue = getSplitString(input, ' ',2).toInt();
    #ifdef DEBUG_BACKEND
    Serial.println("Parsed a color");
    Serial.print("Red   : ");Serial.println(red);
    Serial.print("Green : ");Serial.println(green);
    Serial.print("Blue  : ");Serial.println(blue);
    #endif
    myLightBar->setMainColor(red,green,blue);
  }
  else if(command == 'M'){
    lastHeartbeat = millis();
    int newMode = getSplitString(input, ' ',0).toInt();
    #ifdef DEBUG_BACKEND
    Serial.println("Parsed a color mode");
    Serial.println(newMode);
    #endif
    myLightBar->setMode(newMode);
  }

  
}

#define CORRECTION_FACTOR 0.9665
void updateVoltage(){
  if( (( millis() - lastVoltageUpdate ) > 1000 ) && (connectionCount > 0)){
  int sensorValue = analogRead(A0);
  float voltage = sensorValue * (5.0 / 1023.0)*CORRECTION_FACTOR;
  // print out the value you read:
  String reading = String(voltage,2);
  String command = "V "+reading;
  #ifdef DEBUG_BACKEND
  Serial.println("Voltage: ");Serial.print(voltage);
  #endif
  int payloadLength = command.length()+1;
  char payload[payloadLength];
  command.toCharArray(payload,payloadLength);
  
  socketServer.broadcastTXT((uint8_t*)payload, payloadLength);
  lastVoltageUpdate = millis();
  }
}



/*** ROUTING UART COMMUNICATION TO WEBSOCKET***/
void startWebsocket() { // Start a WebSocket server
  socketServer.begin();                          // start the websocket server
  socketServer.onEvent(webSocketEvent);          // if there's an incomming websocket message, go to function 'webSocketEvent'
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) { // When a WebSocket message is received
  switch (type) {
    case WStype_DISCONNECTED:  
      connectionCount--;
      #ifdef DEBUG_BACKEND
      Serial.println("Socket Disconnected");  
      #endif   
      break;
    case WStype_CONNECTED: 
      connectionCount++;
      #ifdef DEBUG_BACKEND
      Serial.println("Socket Connected");
      #endif
      break;
    case WStype_TEXT:
      char input[lenght];
      
      for(int i = 0; i < lenght; i++){
        input[i] = (char)payload[i];
      }
      //#ifdef DEBUG
      //Serial.print("Received Websocket input: ");
      //#endif
      //Serial.println(input);
      String stringInput = input;
      parseInput(stringInput);
      break;
  }
}

String getSplitString(String data, char separator, int index)
{
  int found = 0;
  int strIndex[] = {0, -1};
  int maxIndex = data.length()-1;

  for(int i=0; i<=maxIndex && found<=index; i++){
    if(data.charAt(i)==separator || i==maxIndex){
        found++;
        strIndex[0] = strIndex[1]+1;
        strIndex[1] = (i == maxIndex) ? i+1 : i;
    }
  }

  return found>index ? data.substring(strIndex[0], strIndex[1]) : "";
}
