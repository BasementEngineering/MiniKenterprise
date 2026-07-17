export const Communication_Commands = {
	ControlLR: 1,
	ControlSD: 2,
	ControlLed: 3,
	Heartbeat: 4,
	Status: 5
  };

export class Parser{
	generateEmptyCommand(){
		return{
			id: 0,
			parameterCount: 0,
			parameters: []
		}
	}

	decodeCommand(input){
		//console.log("Decoding from String: ");
		//console.log(input);
	
		var command = this.generateEmptyCommand();
	
		var parts = input.split(" ");
		command.id = parseInt(parts[0]);
		
		parts.shift(); //remove first element
		command.parameterCount = parts.length;
		for(var i = 0; i < command.parameterCount ;i++){
			command.parameters.push(parts[i]);
		} 
		//console.log("Decoded command: ");
		//console.log(command);
		return command;
	}
	
	encodeCommand(command){
		//console.log("Encoding command: ");
		//console.log(command);
	
		var output = "";
		output += String(command.id);
		for( var i = 0; i < command.parameterCount; i++){
			output += " ";
			output += String(command.parameters[i]);
		}
	
		return output;
	}
	
	//Input | Messages from GUI to MCU
	getHeartbeatCommand(){
		var command = this.generateEmptyCommand();
		command.id = Communication_Commands.Heartbeat;
		command.parameterCount = 0;
		return command;
	}

}