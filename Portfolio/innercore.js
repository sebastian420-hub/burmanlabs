let ones = [];
let zeros = [];
let x;
let y;

let boolean = true;



function setup() {
  createCanvas(windowWidth, 300, document.getElementById('sketch1'));
  

  
    
 
  for (let i = 0; i < 80; i++) {
    ones.push(new One());
  }
    for (let i = 0; i < 80; i++) {
    zeros.push(new Zero());
  }
}

 function draw() {
  background(252,76,2);
 
   
   for (let i = 0; i < ones.length; i++) {
    ones[i].update();
    ones[i].display();
 }   
   
      for (let i = 0; i < zeros.length; i++) {
    zeros[i].update();
    zeros[i].display();
 } 
   
}
  
class One {
  constructor() {
    this.x = random(width); 
    this.y = -20;             
    this.speed = random(5, 8); 
    if(boolean){
      this.speed = random(1, 2); 
    }
    
  }

  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = -20;
      this.x = random(width);
    }
    if(boolean){
         this.y += this.speed;
    }}
  display() {
    
     text('1',this.x,this.y)
   
   
  }
}
    class Zero {
  constructor() {
    this.x = random(width); 
    this.y = -20;             
    this.speed = random(3, 5); 
    if(boolean){
      this.speed = random(1, 2); 
    }
    
  }

  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = -20;
      this.x = random(width);
    }
    if(boolean){
         this.y += this.speed;
    }}
  display() {
    text('0',this.x,this.y)
   
   
  }
}

 windowResized = function() {
   resizeCanvas(windowWidth, 500);
};




function keyPressed() {
  if (keyCode === 75) {
    boolean = !boolean;
    console.log(boolean);
    } }
