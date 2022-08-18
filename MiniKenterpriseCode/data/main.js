function init(){
    initUi();
    Communication_setStatusCallback(onStatusUpdate);
    Communication_setOnlineCallback(onOnline);
    Communication_setOfflineCallback(onOffline);

    setTimeout(function(){
        console.log("Attemptring to connect");
        Communication_connect();
        startReconnection();
        setInterval(function(){
            updateControls();
            sendHeartbeat();
          }, 100);

    },2000);
}

Window.onload = init();

var reconnectionTimer = -1;
var prevConnectionState = true;

function onOffline(){
    console.log("Went offline");
    startReconnection();
    showErrorMessage();
    leftJoystick.reset();
    rightJoystick.reset();
}

function onOnline(){
    console.log("Went back online");
    clearInterval(reconnectionTimer);
    reconnectionTimer = -1;
    hideErrorMessage();
}

function startReconnection(){
    if(reconnectionTimer == -1){
        console.log("Setting reconnection timer");
        reconnectionTimer = setInterval(() => {
            console.log("Attempting reconnection");
            Communication_reconnect();
        }, 5000);
    }
}

function onStatusUpdate(command){
    var batteryPercentage = parseInt(command.parameters[0]);
    var networkPercentage = parseInt(command.parameters[1]);
    percentageToIcon(batteryPercentage,"Battery");
    percentageToIcon(networkPercentage,"Network");
}

function updateControls(){
	if( (leftJoystick!= null) && (rightJoystick!= null) ){
		var command = Communication_generateEmptyCommand();

		if(mode == 1 || mode == 2){	
			command.id = Communication_Commands.ControlSD;
		}
		else if( (mode == 3) || (mode == 4) )
		{
			command.id = Communication_Commands.ControlLR;
		}
		command.parameterCount = 2;
		command.parameters.push(leftJoystick.getPercentage()); //steering
		command.parameters.push(rightJoystick.getPercentage());
		Communication_sendCommand(command);	
	}
}

function sendLedData(){
    var ledMode = document.getElementById("LedModeSelect").value;
    var hexColor = document.getElementById("LedColorPicker").value;
    console.log(hexColor);
    var rgbColor = hexToRgb(hexColor);

    var command = Communication_generateEmptyCommand();
    command.id = Communication_Commands.ControlLed;
    command.parameterCount = 4;
    command.parameters.push(ledMode);
    command.parameters.push(rgbColor.r);
    command.parameters.push(rgbColor.g);
    command.parameters.push(rgbColor.b);

    Communication_sendCommand(command);	
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  
