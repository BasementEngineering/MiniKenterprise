window.setInterval(function(){
	sendCommand("H");
  }, 1000);

function sendLeftSpeed(speed){
	sendCommand("L "+speed);
}

function sendRightSpeed(speed){
	sendCommand("R "+speed);
}

var socket = null;

function openSocket(){
	try{
		socket = new WebSocket('ws://' + location.hostname + ':81/');
		socket.onopen = function () {
		  console.log("Opened socket");
		  this.send("Hello Wordl");
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
}

//*** OUTPUT Code -> to MCU */
var lastCommand = "";

function sendCommand(commandString){
	console.log("->"+commandString);
	lastCommand = commandString;

	if(socket != null){
	    socket.send(commandString+"\n");
	}
	else{
		console.log("Socket is null");
	}
}

function checkResponse(response){
	console.log(response);
}