window.setInterval(function(){
	sendCommand("H");
  }, 1000);

function sendSteering(direction){
	sendCommand("D "+direction);
}

function sendSpeed(speed){
	sendCommand("S "+speed);
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
	if( response.includes("V") ){
		var value = response.substring(2);
		document.getElementById("voltage").value = value + " V";
	}
}