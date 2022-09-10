#ifndef FRONTEND_SERVER_H
#define FRONTEND_SERVER_H

#include <ESP8266WebServer.h>
#define DEBUG_FRONTEND_SERVER

bool serverOnline = false;

ESP8266WebServer server(80);

//Function Prototypes
void FrontendServer_init();
String getContentType(String filename);
bool handleFileRead(String path);
void FrontendServer_update();
void FrontendServer_start();
void FrontendServer_stop();

void FrontendServer_init(){
  SPIFFS.begin();                           // Start the SPI Flash Files System
  server.onNotFound([]() {                              // If the client requests any URI
    if (!handleFileRead(server.uri()))                  // send it if it exists
      server.send(404, "text/plain", "404: Not Found"); // otherwise, respond with a 404 (Not Found) error
  });

  FrontendServer_start();
}

void FrontendServer_update(){
  server.handleClient();
}

void FrontendServer_start(){
  server.begin();
  serverOnline = true;
}

void FrontendServer_stop(){
  server.stop();
  serverOnline = false;
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
  #ifdef DEBUG_FRONTEND_SERVER
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
#endif
