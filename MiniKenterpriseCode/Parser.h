#ifndef PARSER_H
#define PARSER_H

#include <WebSocketsServer.h>
#define DEBUG_COMMUNICATION_LOGIC
#define DEBUG

#define HEARTBEAT_INTERVAL 500
#define HEARTBEAT_TIMEOUT 2000

enum Communication_Commands {
    ControlLR = 1,
    ControlSD = 2,
    ControlLed = 3,
    Heartbeat = 4,
    Status = 5
  };

  #define MAX_PARAM_COUNT 6
  
  struct Command {
    int id;
    int parameterCount;
    int parameters[MAX_PARAM_COUNT];
  };

WebSocketsServer socketServer = WebSocketsServer(81);
bool parserOnline = false;
unsigned long heartbeatTimer = -1;
unsigned long lastReceivedHeartbeat = 0;
unsigned long lastSentHeartbeat = 0;

void (*myMovementCallback)(Command command);
void (*myLedCallback)(Command command);

//Function Prototypes
void Parser_setup(void (*movementCallback)(Command command),void (*ledCallback)(Command command));
void Parser_init();
bool Parser_online();
void Parser_update();
void Parser_sendCommand(Command command);
void checkHeartBeat();
void sendHeartbeat();
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length);
void processInput(String input);
Command decodeCommand(String input);
String encodeCommand(Command command);
void printCommand(Command command);
int extractParameters(String input,int* valueBuffer);

void Parser_setup(void (*movementCallback)(Command command),void (*ledCallback)(Command command)){
  myMovementCallback = movementCallback;
  myLedCallback = ledCallback;
}

void Parser_init(){
  socketServer.begin();                          // start the websocket server
  socketServer.onEvent(webSocketEvent);          // if there's an incomming websocket message, go to function 'webSocketEvent'
}

bool Parser_online(){
    return parserOnline;
}

void Parser_update(){
  socketServer.loop();
  checkHeartBeat();
}

void Parser_sendCommand(Command command){
  String commandString = encodeCommand(command);
  Serial.print("Server->");Serial.println(commandString);
  int payloadLength = commandString.length()+1;
  char payload[payloadLength];
  commandString.toCharArray(payload,payloadLength);
  
  socketServer.broadcastTXT((uint8_t*)payload, payloadLength);
}

void checkHeartBeat(){
  if( (millis() - lastSentHeartbeat) > HEARTBEAT_INTERVAL){
    lastSentHeartbeat = millis();
    if(parserOnline){
        sendHeartbeat();
      }
  }
  if( (millis() - lastReceivedHeartbeat) > HEARTBEAT_TIMEOUT){
    parserOnline = false;
  }
}

void sendHeartbeat(){
    Command command;
    command.id = Heartbeat;
    command.parameterCount = 0;
    Parser_sendCommand(command);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) { // When a WebSocket message is received
  switch (type) {
    case WStype_DISCONNECTED:    
      #ifdef DEBUG
      Serial.println("WS disconnected");
      #endif   
      break;
    case WStype_CONNECTED: 
      #ifdef DEBUG
      Serial.println("WS connected");
      #endif
      break;
    case WStype_TEXT:
      char input[length+1];
      unsigned int stringLength = length;
      for(int i = 0; i < length; i++){
        input[i] = (char)payload[i];
      }
      input[length] = '\0';
      processInput(String(input));

      
      #ifdef DEBUG
      //Serial.print("Received Websocket input ");
      //Serial.print("length: ");Serial.println(length);
      //Serial.print("input: "); Serial.println(String(input));
      #endif
      
      break;
  }
}

void processInput(String input){
    Command command = decodeCommand(input);

    switch( command.id ){
      case Heartbeat: 
      parserOnline = true;
      lastReceivedHeartbeat = millis();
      break;
      case ControlLed: myLedCallback(command);
      break;
      default: myMovementCallback(command);
      break;
    }
}

Command decodeCommand(String input){
  Command command;
  #ifdef DEBUG_COMMUNICATION_LOGIC
  Serial.print(input);
  Serial.println(" <-Client");
  #endif

  char splitChar = ' ';
  int cutPosition = input.indexOf(splitChar);
  String commandId = input.substring(0,cutPosition);
  command.id = commandId.toInt();
  input.remove(0,cutPosition+1);

  /*#ifdef DEBUG_COMMUNICATION_LOGIC
  Serial.print("Input        :");Serial.println(input);
  Serial.print("id        :");Serial.println(command.id);
  #endif*/

  if(input.length() > 0){
    command.parameterCount = extractParameters(input,command.parameters);
  }
  return command;
}

String encodeCommand(Command command){
  String commandString = "";
  commandString+=command.id;
  commandString+=" ";
  for(int i = 0; i < command.parameterCount; i++){
    commandString+=command.parameters[i];
    if( i < (command.parameterCount - 1) ){
      commandString+=" ";
    }
  }
  #ifdef DEBUG_COMMUNICATION_LOGIC
  //Serial.print("encoded command to: ");
  //Serial.println(commandString);
  #endif
  return commandString;
}


void printCommand(Command command){
  Serial.println("Command");
  Serial.print("   id: ");Serial.println(command.id);
  Serial.print("   parameterCount: ");Serial.println(command.parameterCount);
  Serial.println("   parameters: {");
  for(int i = 0; i < MAX_PARAM_COUNT; i++){
    Serial.print(" ");Serial.print(command.parameters[i]);Serial.print(" ");
  }
  Serial.println();
  Serial.println("   }");
}

// HELPER Functions
int extractParameters(String input,int* valueBuffer){
  //Serial.println("Searching for parameters in " + input);

  char splitChar = ' ';
  int positionBuffer[MAX_PARAM_COUNT]={0,0,0,0,0};
  int numberOfParams = 0;

  boolean endReached = false;
  int searchStart = 0;
  while(!endReached && (numberOfParams < MAX_PARAM_COUNT)){
    //Serial.println("searchStart: " + String(searchStart));
    searchStart = input.indexOf(splitChar,searchStart); //found a split char
    if(searchStart > -1){
      searchStart+= 1;
      numberOfParams++;
      positionBuffer[numberOfParams] = searchStart;
      valueBuffer[numberOfParams-1] = input.substring(positionBuffer[numberOfParams-1],positionBuffer[numberOfParams]).toInt();
    }
    else{
      numberOfParams++;
      valueBuffer[numberOfParams-1] = input.substring(positionBuffer[numberOfParams-1],input.length()).toInt();
      endReached = true;
    }
  }

  //Serial.print("Extracted: "); Serial.print(numberOfParams); Serial.println(" parameters");
  return numberOfParams;
}

#endif
