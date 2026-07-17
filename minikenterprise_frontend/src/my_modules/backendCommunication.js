import { Parser, Communication_Commands } from "./parser"
import globalContext from "./dataBuffer"

const HEARTBEAT_INTERVAL=500;
const HEARTBEAT_TIMEOUT=2000;

export class CommunicationManager{
	constructor(){
		this.socket = null;
		this.online = false;
		this.heartbeatTimer = -1;
		this.lastReceivedHeartbeat = 0;

		this.inputUpdateTimer = null;

		this.myStatusCallback = null;
		this.onOfflineCallback = null;
		this.onOnlineCallback = null;

		this.leftJoystick = null;
		this.rightJoystick = null;

		this.parser = new Parser;

		this.lastCommand = "";
	}

	isOnline(){
		return online;
	}

	setStatusCallback(cb){
		this.myStatusCallback = cb;
	}
	
	setOnlineCallback(cb){
		this.onOnlineCallback=cb;
	}
	
	setOfflineCallback(cb){
		this.onOfflineCallback=cb;
	}

	setInputJoysticks(left,right){
		this.leftJoystick = left;
		this.rightJoystick = right;
	}

	// Input Updates
	activateAutoUpdates(){
		this.inputUpdateTimer = window.setInterval(function(){
			this.updateControls();
		  }, 100);
	}

	updateControls(){
		if( (this.leftJoystick!= null) && (this.rightJoystick!= null) ){
			var command = this.parser.generateEmptyCommand();
	
			var mode = globalContext.mode;
			if(mode == 1 || mode == 2){	
				command.id = Communication_Commands.ControlSD;
			}
			else if( (mode == 3) || (mode == 4) )
			{
				command.id = Communication_Commands.ControlLR;
			}
			command.parameterCount = 2;
			command.parameters.push(this.leftJoystick.getPercentage());

			//Adding trim to steering
			if(mode == 1 || mode == 2){
				var steeringValue = this.rightJoystick.getPercentage();
				steeringValue = this.addTrimToSteering(steeringValue);
				command.parameters.push(steeringValue);
			}
			else{
				command.parameters.push(this.rightJoystick.getPercentage());
			}
			this.sendCommand(command);	
		}

	}

	addTrimToSteering(steeringValue){
		var trim = globalContext.trimValue;
		
		steeringValue = (steeringValue - trim);
		if(steeringValue > 100){
			steeringValue = 100;
		}
		else if(steeringValue < -100){
			steeringValue = -100;
		}
		return steeringValue;
	}
	// Heartbeat Specific Stuff
	
	startHeartbeatCheck(){
		this.heartbeatTimer = setInterval(() => {
			this.sendHeartbeat();
			this.checkHeartbeat();
		}, HEARTBEAT_INTERVAL);
	}

	//Input | Messages from GUI to MCU
	sendHeartbeat(){
		var command = this.parser.getHeartbeatCommand();
		this.sendCommand(command);	
	}

	checkHeartbeat(){
    	if( (Date.now() - this.lastReceivedHeartbeat) > HEARTBEAT_TIMEOUT){
        	this.disconnect();
        	console.log("Communication timed out");
    	}
	}

	// Socket Stuff
	openSocket(){
		try{
			//this.socket = new WebSocket('ws://' + "1.2.3.4" + ':81/');
			this.socket = new WebSocket('ws://' + location.hostname + ':81/');
			this.socket.onopen = function () {
			  console.log("Opened socket");
			  //onOpen();
			};
			this.socket.onerror = function (error) {
			};
			this.socket.onmessage = function (e) {
			  console.log('Server: ', e.data);
			  this.checkResponse(e.data);
			  this.processMessage(e.data);
			}.bind(this);
			this.socket.onclose = function () {
			  console.log('WebSocket connection closed');
			};
			}
			catch{}
	}

	connect(){
		this.openSocket();
	}
	
	reconnect(){
		this.disconnect();
		this.connect();
	}

	disconnect(){
		this.online = false;
		if(this.onOfflineCallback != null){
			this.onOfflineCallback();
		}
		
		if(this.socket != null){
			this.socket.close();
		} 
		if(this.heartbeatTimer != -1){
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = -1;
		}
		
	}

	// Actual command sending
	sendCommand(command){
		console.log(this.parser.encodeCommand(command));
		//console.log("->"+command);
		this.lastCommand = command;
	
		if(this.socket != null){
			if(this.socket.readyState === this.socket.OPEN){
				this.socket.send(this.parser.encodeCommand(command));
			}
		}
		else{
			//console.log("Socket is null");
		}
	}

	checkResponse(response){
		if( response.includes("V") ){
			var value = response.substring(2);
			//document.getElementById("BatteryVoltage").value = value + " V";
			batteryVoltage = parseFloat(value);
		}
	}

/* ToDo: Fix this
	Uncaught TypeError: this is undefined
    processMessage backendCommunication.js:176
    onmessage backendCommunication.js:115
    openSocket backendCommunication.js:112
    connect backendCommunication.js:125
    init main.js:31
    setTimeout handler*init main.js:29
    <anonymous> main.js:39
*/
	processMessage(input){
		console.log(input+" <-Server ");
		var command = this.parser.decodeCommand(input);
		
		switch( command.id ){
			case Communication_Commands.Status: 
				if(this.myStatusCallback != null){
					this.myStatusCallback(command);
				}
				break;
			case Communication_Commands.Heartbeat: 
				if(!this.online){
					this.onOnlineCallback();
				}
				this.online = true;
				this.lastReceivedHeartbeat = Date.now();
	
				break;
			default:
			break;
		}
	}
}


/*
function updateControls(){
	if( (leftJoystick!= null) && (rightJoystick!= null) ){
		var command = generateCommand();

		if(mode == 1 || mode == 2){	
			command.id = Commands.ControlSD;
		}
		else if( (mode == 3) || (mode == 4) )
		{
			command.id = Commands.ControlLR;
		}
		command.parameterCount = 2;
		command.parameters.push(leftJoystick.getPercentage()); //steering
		command.parameters.push(rightJoystick.getPercentage());
		sendCommand(command);	
	}
}

var socket = null;

function openSocket(){
	try{
		socket = new WebSocket('ws://' + location.hostname + ':81/');
		socket.onopen = function () {
		  console.log("Opened socket");
		  //onOpen();
		};
		socket.onerror = function (error) {
		};
		socket.onmessage = function (e) {
		  console.log('Server: ', e.data);
		  checkResponse(e.data);
		};
		socket.onclose = function () {
		  console.log('WebSocket connection closed');
		};
		}
		catch{}
}*/

//*** OUTPUT Code -> to MCU */
//var lastCommand = "";
/*
function sendCommand(command){
	//console.log("->"+commandString);
	lastCommand = commandString;

	if(socket != null){
		if(socket.readyState === socket.OPEN){
			socket.send(encodeCommand(command+"\n");
		}
	}
	else{
		//console.log("Socket is null");
	}
}*/
/*
function checkResponse(response){
	console.log(response);
	if( response.includes("V") ){
		var value = response.substring(2);
		//document.getElementById("BatteryVoltage").value = value + " V";
		batteryVoltage = parseFloat(value);
	}
}*/







//Feedback | Messages from MCU to GUI 
/*
function processMessage(input){
	//console.log(input+" <-Server ");
	var command = decodeCommand(input);
    
	switch( command.id ){
		case Communication_Commands.Status: 
            if(myStatusCallback != null){
                myStatusCallback(command);
            }
            break;
		case Communication_Commands.Heartbeat: 
			if(!online){
				onOnlineCallback();
			}
			online = true;
            lastReceivedHeartbeat = Date.now();

		    break;
		default:
		break;
	}
}*/
/*
function openSocket(){
	try{
		socket = new WebSocket('ws://' + location.hostname + ':81/');
		socket.onopen = function () {
		  console.log("Opened socket");
		  startHeartbeatCheck();
          lastReceivedHeartbeat = Date.now();
		};
		socket.onerror = function (error) {
		};
		socket.onmessage = function (e) {
		  //console.log('Server: ', e.data);
		  processMessage(e.data);
		};
		socket.onclose = function () {
		  console.log('WebSocket connection closed');
          Communication_disconnect()
		};
		}
		catch{}
}*/
