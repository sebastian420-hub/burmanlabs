let x;
let y;
let img;
let xx = 137;
let ab;
let bc;
let moveX;
let moveY;
let delayFrames = 480;
let currentFrame = 0;

let boolean = false;



function setup() {
  createCanvas(265, 250);
}

function draw() {
  background(255,255,255);
  
  x = map(mouseX,0, width, -3,3.2,1);
  y = map(mouseY,0, width, -1.8,1,1);
  
  if (!boolean) {
  if (currentFrame >= 300){ 
    xx = 137;
    currentFrame += 20;
     if (currentFrame >= delayFrames){
     xx = 120.5;
      
     currentFrame = 0;}
  } else {
   currentFrame ++;
  console.log(currentFrame);
}
} 
  
  push();
  fill(0);
  ellipse(132,120,200,200);
  fill(229,155,125);
  beginShape();
  curveVertex(136,119);
  curveVertex(52,95);
  curveVertex(65,149);
  curveVertex(198,149);
  curveVertex(215,95);
  endShape(CLOSE);
  pop();
  
  
  beginShape(CLOSE);
  curveVertex(120,158);
  curveVertex(137,144);
  curveVertex(156,158);
  curveVertex(120,158);
  curveVertex(137,144);
  endShape(CLOSE);
  

  
  
  eyeOne = new eyeRight(10,20,10,xx,173.7,40);
  eyeTwo = new eyeRight(220,220,220,137,167,43);
  eyePupilOne = new eyePupil(15,15,99,78,52);
  eyePupilTwo = new eyePupil(5.5,5.5,0,0,0);
  eyeTwo.show();
  eyePupilOne.display();
  eyePupilTwo.display();
  eyeOne.show();
  
  eyeOneOne = new eyeLeft(10,20,10,xx,173.7,40);
  eyeTwoTwo = new eyeLeft(220,220,220,137,167,43);
  eyePupilOnee = new eyePupill(15,15,99,78,52);
  eyePupilTwoo = new eyePupill(5.5,5.5,0,0,0);
  eyeTwoTwo.show();
  eyePupilOnee.display();
  eyePupilTwoo.display();
  eyeOneOne.show();
  
  let mouseXCoord = mouseX;
  let mouseYCoord = mouseY;

  // Log the x and y coordinates in the console
  console.log("X Coordinate: " + mouseXCoord);
  console.log("Y Coordinate: " + mouseYCoord);
}

class eyeRight{
  constructor(r,g,b,x,y,position){
    this.red = r;
    this.green = g;
    this.blue = b;
    this.x = x;
    this.y = y;
    this.position = position;
  }
  
  show(){
  fill(this.red,this.green,this.blue);
  stroke(0,0,0);
  strokeWeight(0.5)
  
beginShape(CLOSE);
  curveVertex(160,131);
  curveVertex(160,129);
  curveVertex(183,117);
  curveVertex(205,128);
  curveVertex(183,this.x);
endShape(CLOSE);
    }
}

class eyeLeft{
  constructor(r,g,b,x,y,position){
    this.red = r;
    this.green = g;
    this.blue = b;
    this.x = x;
    this.y = y;
    this.position = position;
  }
  
  show(){
  fill(this.red,this.green,this.blue);
  stroke(0,0,0);
  strokeWeight(0.5);
  
beginShape(CLOSE);
  curveVertex(110,131);
  curveVertex(110,129);
  curveVertex(85,117);
  curveVertex(62,128);
  curveVertex(85,this.x);
endShape(CLOSE);
    }
}

class eyePupil {
  constructor(w,h,r,g,b){
    this.w = w;
    this.h = h;
    this.r = r;
    this.g = g;
    this.b = b;
    
  }
  display(){
   fill(this.r,this.g,this.b);
   ellipse(182+x,128+y,this.w,this.h);
}
  
}
class eyePupill {
  constructor(w,h,r,g,b){
    this.w = w;
    this.h = h;
    this.r = r;
    this.g = g;
    this.b = b;
    
  }
  display(){
   fill(this.r,this.g,this.b);
   ellipse(85+x,128+y,this.w,this.h);
}
  
}


console.log();