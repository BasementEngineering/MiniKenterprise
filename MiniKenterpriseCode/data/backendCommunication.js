window.setInterval(function(){
	if( (leftJoystick!= null) && (rightJoystick!= null) ){
		if(mode == 1 || mode == 2){
			sendCommand("S "+leftJoystick.getPercentage()); //steering
			sendCommand("D "+rightJoystick.getPercentage()); //speed
		}
		else if( (mode == 3) || (mode == 4) )
		{
			sendCommand("L "+leftJoystick.getPercentage()); // leftspeed
			sendCommand("R "+rightJoystick.getPercentage()); //rightspeed
		}
		
	}
  }, 100);

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
	//console.log("->"+commandString);
	lastCommand = commandString;

	if(socket != null){
		if(socket.readyState === socket.OPEN){
			socket.send(commandString+"\n");
		}
	}
	else{
		//console.log("Socket is null");
	}
}

function checkResponse(response){
	console.log(response);
	if( response.includes("V") ){
		var value = response.substring(2);
		//document.getElementById("BatteryVoltage").value = value + " V";
		batteryVoltage = parseFloat(value);
	}
}