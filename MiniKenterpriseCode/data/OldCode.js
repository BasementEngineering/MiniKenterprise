  /*function showBatteryBars(bars){
    for(var i = 0; i < 4; i++){
      if(i < bars){
        document.getElementById("bar"+i).style.visibility = "visible";
      }
      else{
        document.getElementById("bar"+i).style.visibility = "hidden";
      }
    }
  }

  function drawBatteryIcon(){
    const levelLimits = [3.50,3.75,3.82,4.00];
    document.getElementById("BatteryVoltage").textContent = batteryVoltage + " V";

      if(batteryVoltage >= levelLimits[3]){
        showBatteryBars(4);
      }
      else if( ( batteryVoltage < levelLimits[3] ) && ( batteryVoltage >= levelLimits[2] ) ){
        showBatteryBars(3);
      }
      else if( ( batteryVoltage < levelLimits[2] ) && ( batteryVoltage >= levelLimits[1] ) ){
        showBatteryBars(2);
      }
      else if( ( batteryVoltage < levelLimits[1] ) && ( batteryVoltage > levelLimits[0] ) ){
        showBatteryBars(1);
      }
      else{
        showBatteryBars(0);
      }
  }*/