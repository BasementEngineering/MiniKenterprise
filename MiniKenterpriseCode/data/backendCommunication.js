window.setInterval(function(){
	updateControls();
  }, 100);



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
}

//*** OUTPUT Code -> to MCU */
var lastCommand = "";

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
}

function checkResponse(response){
	console.log(response);
	if( response.includes("V") ){
		var value = response.substring(2);
		//document.getElementById("BatteryVoltage").value = value + " V";
		batteryVoltage = parseFloat(value);
	}
}