function init(){
    initUi();
    setTimeout(function(){
        Communication_setStatusCallback(onStatusUpdate);
        Communication_connect();
        /*setInterval(() => {
            checkConnection();
        }, 2000);*/
    
        setInterval(function(){
            updateControls();
            sendHeartbeat();
          }, 100);

    },2000);
}

Window.onload = init();

function checkConnection(){
    if(! Communication_online()){
        Communication_reconnect();
        leftJoystick.reset();
        rightJoystick.reset();
        showErrorMessage();
    }
    else{
        hideErrorMessage();
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

  
