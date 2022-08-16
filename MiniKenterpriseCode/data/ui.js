class Joystick{
  constructor(elementName,rotate){
      this.name = elementName;
      this.offset = 10;
      this.rotate = rotate; //0 = vertical , 1 = horizontal
      this.percentage = 0;
      this.sticky = false;
      this.isTouched = false;
      this.deadband = 0;

      this.sidelenght = document.getElementById(this.name).width;

      this.setup();
  }

  setup(){
      this.attachListeners();
      this.drawBackground();
      this.reset();
  }

  getPercentage(){
    return this.percentage;
  }

  drawBackground(){
      var bottomCanvas = document.getElementById(this.name+"Base");
      var trackWidth = this.sidelenght*0.2;
      var ctx = bottomCanvas.getContext("2d");
      ctx.clearRect(0,0, this.sidelenght, this.sidelenght); 
      
      var step = (this.sidelenght-(this.offset*2))/20;
      var lineLength = this.sidelenght*0.4;
  
      for(var i = 0; i<21;i++){
  
          if( (i%5) == 0){
              ctx.lineWidth = 2;
              lineLength = this.sidelenght*0.5;
          }
          else{
              ctx.lineWidth = 1;
              lineLength = this.sidelenght*0.4;
          }
  
          var sideSpace = (this.sidelenght-lineLength)/2;
          ctx.beginPath();
          if(!this.rotate){
              ctx.moveTo(sideSpace, i*step + this.offset);
              ctx.lineTo(this.sidelenght-sideSpace, i*step +this.offset);
          }
          else{
              ctx.moveTo(i*step + this.offset,sideSpace);
              ctx.lineTo(i*step +this.offset,this.sidelenght-sideSpace);
          }
          
          ctx.stroke();
      }
  
      ctx.fillStyle = 'rgb(200,200,200)';
      if(!this.rotate){
          ctx.fillRect((this.sidelenght/2)-(trackWidth/2),0,trackWidth, this.sidelenght);
      }
      else{
          ctx.fillRect(0,(this.sidelenght/2)-(trackWidth/2),this.sidelenght,trackWidth);
      }
        
  }
  
  drawThumb(centerX,centerY){
      var topCanvas = document.getElementById(this.name);
      //console.log("Drawing thumb");
      var position = 0;
      position = (!this.rotate) ? centerY : centerX;
      //console.log("Position: "+position);

      if( position > (this.sidelenght-this.offset) ){
          position = this.sidelenght-this.offset;
      }
      else if(position < this.offset){
          position = this.offset;
      }
  
      var ctx = topCanvas.getContext("2d");
      ctx.clearRect(0,0, this.sidelenght, this.sidelenght); 
      
      if(!this.rotate){
          ctx.fillStyle = 'rgb(255, 204, 0)';
          ctx.fillRect((this.sidelenght/2)-60,position-10, 120, 20); 
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect((this.sidelenght/2)-50,position-10, 100, 20);
      }
      else{
          ctx.fillStyle = 'rgb(255, 204, 0)';
          ctx.fillRect(position-10,(this.sidelenght/2)-60, 20, 120); 
          ctx.fillStyle = 'rgb(0, 0, 0)';
          ctx.fillRect(position-10,(this.sidelenght/2)-50, 20, 100);
      }
  
  }
  
  reset(){
      this.drawThumb(this.sidelenght/2,this.sidelenght/2);
      this.percentage=0;
  }

  setRotation(newRotation){
      this.rotate = newRotation;
      this.drawBackground();
      this.reset();
  }

  setStickyness(newStickyness){
      this.sticky = newStickyness;
      this.reset();
  }

  setDeadband(newDeadbandPercentage){
    this.deadband = newDeadbandPercentage;
  }

  attachListeners(){
      var topCanvas = document.getElementById(this.name);
      topCanvas.addEventListener('mousedown',event => this.onDown());
      topCanvas.addEventListener('mouseup',event => this.onUp());
      topCanvas.addEventListener('mousemove',event => this.processPosition(event) );
  
      topCanvas.addEventListener('touchstart',event => this.onDown());
      topCanvas.addEventListener('touchend',event => this.onUp());
      topCanvas.addEventListener('touchmove',event => this.processPosition(event) );
  }

  onDown(){
      //console.log("Down");
      this.isTouched = true;
      //console.log(this.isTouched);
  }

  onUp(){
      //console.log("Up");
      this.isTouched = false;
      if(!this.sticky){
          this.reset();
      }
  }

  processPosition(event){
      var posX = 0;
      var posY = 0;
      if(event.type == "touchmove"){
          var rect = event.target.getBoundingClientRect();
          var touch = event.targetTouches[0];
          posX = touch.pageX- rect.left;;
          posY = touch.pageY - rect.top;;
      }
      else if(event.type == "mousemove"){
          posX = event.offsetX;
          posY = event.offsetY;
      }
      
      if(this.isTouched){
          //console.log("process postiton");
          //console.log("X: " + posX + " | Y: " + posY )
          //var oldPercentage = this.percentage;
          this.calculatePercentage(posX,posY);
          //var newPercentage = this.percentage;
          //var difference = oldPercentage - newPercentage;
          //if( (difference > 1 || difference < -1) || (newPercentage == 0) ){
            this.drawThumb(posX,posY);
          //} 
      }
  }

  calculatePercentage(posX,posY){
      var position = 0;
      position = (!this.rotate) ? posY : posX;

      if( position > (this.sidelenght-this.offset) ){
          position = this.sidelenght-this.offset;
      }
      else if(position < this.offset){
          position = this.offset;
      }

      var fullRangePx = this.sidelenght-(this.offset*2);
      var centerPos = this.sidelenght/2;
      var pixelDifference = (centerPos-position);
      var newValue = Math.round(-pixelDifference * (200/fullRangePx) );
      if( (newValue < -this.deadband) || (newValue > this.deadband) ){
        if(this.rotate){
          this.percentage = -newValue; //positive is right, negative left
        }  
        else{
          this.percentage = newValue;//positive is up, negative down
        }
      }
      else{
        this.percentage = 0;
      }
      
      console.log(this.percentage + " %");
  }

}

/*window.setInterval(function(){
	drawBatteryIcon();
  }, 500);*/

function initUi(){
  scaleItems();
  setupJoysticks();
 // drawBatteryIcon();
  setMode(1);
}

function scaleItems(){
  var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
  console.log("Width: "+width);
  var joystickWidth = width * 0.22;
  setJoystickSize("LeftJoystick",joystickWidth);
  setJoystickSize("RightJoystick",joystickWidth);
}

function setJoystickSize(name,size){
  document.getElementById(name+"Container").style.width = size+20;
  document.getElementById(name+"Container").style.height = size+20
  document.getElementById(name+"Base").width = size;
  document.getElementById(name+"Base").height = size;
  document.getElementById(name).width = size;
  document.getElementById(name).height = size;
}

function setupJoysticks(){
  leftJoystick = new Joystick("LeftJoystick",false);
  rightJoystick = new Joystick("RightJoystick",false);

  document.getElementById("Mode1Button").addEventListener("click", e => setMode(1) );
  document.getElementById("Mode2Button").addEventListener("click", e => setMode(2) );
  document.getElementById("Mode3Button").addEventListener("click", e => setMode(3) );
  document.getElementById("Mode4Button").addEventListener("click", e => setMode(4) );
}

function highlightModeButton(newMode){
  for(var i = 1; i <= 4; i++){
    document.getElementById("Mode"+i+"Button").style.borderColor = (i==newMode) ? "rgb(255, 204, 0)" : "rgb(179, 178, 175)";
  }
}

function setMode(newMode){
  mode = newMode;
  highlightModeButton(newMode);

  if(newMode == 1 || newMode == 2){
    leftJoystick.setDeadband(25);
    rightJoystick.setDeadband(0);
    rightJoystick.setRotation(true); //left right steering  
    if(newMode == 1){
      leftJoystick.setStickyness(false);
    }
    else{
      leftJoystick.setStickyness(true);
    }
  }
  else if(newMode == 3 || newMode == 4){
    leftJoystick.setDeadband(25);
    rightJoystick.setDeadband(25);
    rightJoystick.setRotation(false);
    if(newMode == 3){
      leftJoystick.setStickyness(false);
      rightJoystick.setStickyness(false);
    }
    else{
      leftJoystick.setStickyness(true);
      rightJoystick.setStickyness(true);
    }
  }
  
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function sendLedData(){
  var hexColor = document.getElementById("LedColorPicker").value;
  console.log(hexColor);
  var rgbColor = hexToRgb(hexColor);

  sendCommand("C "+ rgbColor.r +" "+rgbColor.g+" "+rgbColor.b);
  sendCommand("M "+ document.getElementById("LedModeSelect").value);
}

function showPopupMenu() {

  var value = document.getElementById("popupMenu").style.visibility;
  
  var newStyle = "visible";
  if(value == "visible"){
    newStyle = "hidden";
  }

  document.getElementById("popupMenu").style.visibility = newStyle;
  console.log("Showing popup menu");

  
  }
   
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

  ////OLD STUFF

  function setShape(elementId){
    console.log("setting shape for: "+elementId);
    var left = document.getElementById(elementId);
    var width = left.clientWidth;
    console.log(width);
    left.style.height = width;
  }
  
  function drawImage(canvas){
    var image   = document.getElementById('Wheel');
    var context = canvas.getContext("2d");
  
    console.log(image);
    image.onload = function() {
        console.log(canvas.width);
        console.log(canvas.height);
        
        context.clearRect(0,0,canvas.width,canvas.height);
        context.save();
    
        context.translate(canvas.width/2,canvas.height/2);
    
        context.rotate(0 * Math.PI / 180);
        context.drawImage(image, -canvas.width/2,-canvas.height/2);
    
        context.restore();
      };
  }