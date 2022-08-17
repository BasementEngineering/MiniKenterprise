const Communication_Commands = {
    ControlLR: 1,
    ControlSD: 2,
    ControlLed: 3,
    Heartbeat: 4,
    Status: 5
  };

var socket = null;
var online = false;
var heartbeatTimer = -1;
var lastReceivedHeartbeat = 0;

var myStatusCallback = null;

function Communication_generateEmptyCommand(){
	return{
		id: 0,
		parameterCount: 0,
		parameters: []
	}
}

function Communication_connect(){
    openSocket();
}

function Communication_reconnect(){
    Communication_disconnect();
    Communication_connect();
}


function Communication_disconnect(){
    if(socket != null){
        socket.close();
    } 
    online = false;
    if(heartbeatTimer != -1){
        clearInterval(heartbeatTimer);
        heartbeatTimer = -1;
    }
    
}

function Communication_online(){
    return online;
}

//*** OUTPUT Code -> to MCU */
function Communication_sendCommand(command){
    //console.log(command);
	if(socket != null){
		if(socket.readyState === socket.OPEN){
			socket.send(encodeCommand(command)+"\n");
		}
	}
	else{
		//console.log("Socket is null");
	}
}


function Communication_setStatusCallback(cb){
    myStatusCallback = cb;
}

function decodeCommand(input){
	console.log("Decoding from String: ");
	console.log(input);

	var command = Communication_generateEmptyCommand();

    var parts = input.split(" ");

    command.command = parts[0];
	parts.shift(); //remove first element
	command.parameterCount = parts.length;
	for(var i = 0; i < command.parameterCount ;i++){
		command.parameters.push(parts[i]);
	} 
	console.log("Decoded command: ");
	console.log(command);
	return command;
}

function encodeCommand(command){
	console.log("Encoding command: ");
	console.log(command);

	var output = "";
	output += String(command.id);
	for( var i = 0; i < command.parameterCount; i++){
		output += " ";
		output += String(command.parameters[i]);
	}

	console.log("Output: ");
	console.log(output);

	return output;
}

//Input | Messages from GUI to MCU
function sendHeartbeat(){
	var command = Communication_generateEmptyCommand();
	command.id = Communication_Commands.Heartbeat;
	command.parameterCount = 0;
	Communication_sendCommand(command);	
}

function checkHeartbeat(){
    if( (Date.now() - lastReceivedHeartbeat) > 500){
        Communication_disconnect();
        console.log("Communication timed out");
    }
}
//Feedback | Messages from MCU to GUI 
function processMessage(input){
	console.log("Processing input: "+input);
	var command = decodeCommand(input);
    
	switch( command.id ){
		case Communication_Commands.Status: 
            if(myStatusCallback != null){
                myStatusCallback(command);
            }
            break;
		case Communication_Commands.Heartbeat: 
            lastReceivedHeartbeat = Date.now();
		    break;
		default:
		break;
	}
}

function openSocket(){
	try{
		socket = new WebSocket('ws://' + location.hostname + ':81/');
		socket.onopen = function () {
		  console.log("Opened socket");
          heartbeatTimer = setInterval(() => {
            sendHeartbeat();
            checkHeartbeat();
            }, 100);
          online = true;
          lastReceivedHeartbeat = Date.now();
		};
		socket.onerror = function (error) {
		};
		socket.onmessage = function (e) {
		  console.log('Server: ', e.data);
		  processMessage(e.data);
		};
		socket.onclose = function () {
		  console.log('WebSocket connection closed');
          Communication_disconnect()
		};
		}
		catch{}
}
