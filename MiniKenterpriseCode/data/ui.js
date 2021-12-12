function initUi(){
	initSteeringSlider();
	initGasSlider();
  document.getElementById("voltage").value = 4.2;
  initColorSliders();
}

function componentToHex(c) {
  c = parseInt(c);
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function showColor(){
  var colorDiv = document.getElementById("colorView");
  var hexValue = rgbToHex(led.red,led.green,led.blue);
  console.log(hexValue);
  colorDiv.value = hexValue;
  colorDiv.style.backgroundColor = hexValue;
}

function sendColor(){
  sendCommand("C "+ led.red +" "+led.green+" "+led.blue);
  sendCommand("M "+ document.getElementById("mode").value);
}

function updateColor(){
  showColor();
}

function initColorSliders() {
 var red = document.getElementById("red");
 var green = document.getElementById("green");
 var blue = document.getElementById("blue");

 red.value=led.red;
 green.value=led.green;
 blue.value=led.blue;

 showColor();
 
 red.oninput = function(){
   led.red = this.value;
   showColor();
 }

 green.oninput = function(){
  led.green = this.value;
  showColor();
}

blue.oninput = function(){
  led.blue = this.value;
  showColor();
}
}

function initSteeringSlider(){
    var slider = document.getElementById("steeringSlider");

    slider.oninput = function() {
	    if( (this.value%5) == 0){
	    sendSteering(this.value);
	  }
    }
  
    slider.onmouseup = function(){
	    this.value = 0;
        sendSteering(this.value);
	}
  
    slider.ontouchend = function(){
	    this.value = 0;
        sendSteering(this.value);
	}
}

function initGasSlider(){
    var slider = document.getElementById("gasSlider");

    slider.oninput = function() {
      if( (this.value > -10) && (this.value < 10)){
        sendSpeed(0);
      }
	    else if( (this.value%5) == 0){
	    sendSpeed(this.value);
	  }
    }
  
}

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
  
  
  
  
  function getCursorPosition(canvas, event) {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      console.log("x: " + x + " y: " + y)
  }
  
  function drawJoystick(canvas){
    var context = canvas.getContext("2d");
    canvas.draw
  
    canvas.addEventListener('mousedown', function(e) {
      getCursorPosition(canvas, e);
    })
  }
   