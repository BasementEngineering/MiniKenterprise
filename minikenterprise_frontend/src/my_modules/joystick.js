// Joystick functions
export class Joystick{
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
        
        //console.log(this.percentage + " %");
    }
  
  }