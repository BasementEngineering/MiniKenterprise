/*
 * The "backend" features all of the logic. 
 * It parses input from the frontend aka. the website running on the connected device 
 * and controls the propulsion system and the leds accordingly.
 */

#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <WebSocketsServer.h>

#include "PropulsionSystem.h"
#include <Adafruit_NeoPixel.h>

#define DEBUG
#define TIMEOUT 2000

int connectionCount = 0;

ESP8266WebServer server(80);
WebSocketsServer socketServer = WebSocketsServer(81);

//Pointers to things that the backend will have access to during runtime
PropulsionSystem* myPropulsionPointer = NULL;
Adafruit_NeoPixel* myLedStrip = NULL;

/*** Function Prototypes ***/
//Main Functions
void setupBackend(PropulsionSystem* pointer, Adafruit_NeoPixel* ledPointer);
void updateBackend();
void parseInput(String input);
//helpers
//... for serving files (such as our frontend website)
String getContentType(String filename);
bool handleFileRead(String path);
//...for settingup our websocket connection
void startWebsocket();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght);
//...for Parsing
String getSplitString(String data, char separator, int index);
//...for led stuff

/***           ***/

unsigned long lastHeartbeat = 0;
#define MOTOR_PWM_CALCULATION (int)(((float)value/100)*255)

void setupBackend(PropulsionSystem* pointer, Adafruit_NeoPixel* ledPointer) {
  myPropulsionPointer = pointer;
  myLedStrip = ledPointer;
  SPIFFS.begin();                           // Start the SPI Flash Files System
  
  server.onNotFound([]() {                              // If the client requests any URI
    if (!handleFileRead(server.uri()))                  // send it if it exists
      server.send(404, "text/plain", "404: Not Found"); // otherwise, respond with a 404 (Not Found) error
  });

  server.begin();
  startWebsocket();
}

void updateBackend(){
  server.handleClient();
  socketServer.loop();
  if( (( millis() - lastHeartbeat ) > TIMEOUT ) && (connectionCount > 0)){
    Serial.println("Timed Out");
    myPropulsionPointer->stop();
  }
}

void parseInput(String input){
  Serial.println("Parsing: ");
  Serial.println(input);

  char command = input.charAt(0);
  input.remove(0,2);
  int value = input.toInt();
  
  if(command == 'L'){
    Serial.println("Left: ");
    Serial.println(MOTOR_PWM_CALCULATION);
    myPropulsionPointer->moveRight(MOTOR_PWM_CALCULATION);
  }
  else if(command == 'R'){
    Serial.println("Right: ");
    Serial.println(MOTOR_PWM_CALCULATION);
    myPropulsionPointer->moveLeft(MOTOR_PWM_CALCULATION);
  }
  else if(command == 'H'){
    lastHeartbeat = millis();
  }
  else if(command == 'C'){
    lastHeartbeat = millis();
    int red = getSplitString(input, ' ',0).toInt();
    int green = getSplitString(input, ' ',1).toInt();
    int blue = getSplitString(input, ' ',2).toInt();
    Serial.println("Parsed a color");
    Serial.print("Red   : ");Serial.println(red);
    Serial.print("Green : ");Serial.println(green);
    Serial.print("Blue  : ");Serial.println(blue);
    myLedStrip->fill(myLedStrip->Color(red,green,blue));
    myLedStrip->show();
  }

  
}

/*** SERVING FILES (index and stuff) ***/
String getContentType(String filename) { // convert the file extension to the MIME type
  if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  return "text/plain";
}

bool handleFileRead(String path) { // send the right file to the client (if it exists)
  #ifdef DEBUG
  Serial.println("handleFileRead: " + path);
  #endif
  if (path.endsWith("/")) path += "index.html";         // If a folder is requested, send the index file
  String contentType = getContentType(path);            // Get the MIME type
  if (SPIFFS.exists(path)) {                            // If the file exists
    File file = SPIFFS.open(path, "r");                 // Open it
    size_t sent = server.streamFile(file, contentType); // And send it to the client
    file.close();                                       // Then close the file again
    return true;
  }
  return false;                                         // If the file doesn't exist, return false
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
      Serial.println("Socket Disconnected");     
      break;
    case WStype_CONNECTED: 
      connectionCount++;
      Serial.println("Socket Connected");
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
