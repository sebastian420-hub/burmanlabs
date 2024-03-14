let red = [255, 246, 255, 246]; //colors of sun and moon
let green = [100, 241, 100, 241];
let blue = [19, 213, 19, 213];

let backRed = [205, 44, 205, 44]; // background sky colors
let backGreen = [240, 26, 240, 26];
let backBlue = [255, 64, 255, 64];

let recRed = [205, 44, 205, 44];
let recGreen = [240, 26, 240, 26];
let recBlue = [255, 64, 255, 64];

let recTwoRed = [205, 44, 205, 44];
let recTwoGreen = [240, 26, 240, 26];
let recTwoBlue = [255, 64, 255, 64];

let xx, xxx, li, lr; // declare but don't assign values yet
let angle = 0;
let angleV = 0;
let angleA = 0;

let dataP = 0;
let canv;

function setup() {
  angleMode(RADIANS);
  canv = createCanvas(windowWidth, windowHeight); // Responsive canvas size
  canv.mouseOver(closeAndOpenDoor); // When mouse hovers over canvas
  updateDoorPositions(); // Call to set initial door positions based on window size
}

function draw() {
  background(backRed[dataP], backGreen[dataP], backBlue[dataP]);

  // Tiny circle is in the center (calculations based on window size)
  push();
  translate(width / 2, height / 2);
  translate(width * 0.05, -height * 0.05);
  ellipse(0, 0, 10, 10);

  // Sun that orbits the tiny circle
  push();
  fill(red[dataP], green[dataP], blue[dataP]);
  rotate(angle);
  translate(width / 4, 0);
  translate(width * 0.2, height * 0.2); // Modify the position of the sun relative to window size
  ellipse(0, 0, width * 0.1, width * 0.1); // Sun size relative to window size
  pop();

  // Similar logic for calculations of positions and sizes based on windowWidth and windowHeight
  // ... (Your existing drawing code with responsive adjustments)

  // Update dataP and angle
  if (angle >= TWO_PI) {
    dataP += 1;
    angle = 0;
  }
  if (dataP == backGreen.length) {
    dataP = 0;
  }
  console.log(dataP);

  pop();
  fill(65,155,10);
  rect(1,350,700,180);
  
 
  fill(188,74,60);
  noStroke();
  rect(20,250,65,140);
  rect(130,250,65,140);
  
  arc(52.5,250,65,75,PI,2*PI);
  arc(162.5,250,65,75,PI,2*PI);
  arc(612.5,250,65,75,PI,2*PI);
  arc(712.5,250,65,75,PI,2*PI);
  
  rect(580,250,65,140);
  rect(680,250,65,140);
  
  
  
  fill(recRed[dataP],recGreen[dataP],recBlue[dataP]);
  rect(35,240,35,12);
  rect(46,228,12,35);
  
  fill(recTwoRed[dataP],recTwoGreen[dataP],recTwoBlue[dataP]);
  rect(145,240,35,12);
  rect(157,228,12,35); 
  
  noErase()
  rect(595,240,35,12);
  rect(607,228,12,35);
  
   fill(188,74,60);
  stroke('black');
  rect(282,200,15,160);
  rect(323,200,15,160);
  rect(412,200,15,160);
  rect(453,200,15,160);
  
  rect(255,250,30,180);
  rect(295,250,30,180);
  
  rect(425,250,30,180);
  rect(465,250,30,180);
  
  // big rectangle 
  
  rect(1,290,260,120);
  rect(500,290,260,120);
  rect(xx,275,130,150);
  rect(xxx,275,130,150);
  
  
  fill(240,230,150);
  triangle(255,250,285,250,269,215);
  triangle(295,250,325,250,310,215);
  
  
  triangle(425,250,455,250,439,215);
  triangle(465,250,495,250,479,215);
  
  //triangle(200,235,560,235,378,90);
  
  rect(322,184,110,28);
  //rect(303,160,150,28);
  beginShape();
   vertex(270,170);
   vertex(490,170);
   vertex(484,190);
   vertex(276,190);
  endShape(CLOSE);
  
  beginShape();
   vertex(210,235);
   vertex(550,235);
   vertex(560,180);
   vertex(375,200);
   vertex(200,180);
  endShape(CLOSE);
  
 quad(330,130, 425, 130, 490,170,270, 170);
  
 quad(350,100,405,100,465,140,290,140);
  
  // top diamond like shape

 beginShape();
  vertex(365,40);
  vertex(388,40);
  vertex(388,45);
  vertex(376,60);
  vertex(365,45);
  
 endShape(CLOSE);
  
  
 beginShape();
 vertex(365,40);
  vertex(388,40);
  vertex(388,35);
  vertex(376,1);
  vertex(365,35)
  
 endShape(CLOSE);
  
  
  
  fill(240,230,150);
  rect(350,60,55,40)
  //triangle(270,170,490,170,378,45);
  
  line(0,318,li,318); //left brick
  line(0,348,li,348);
  line(0,380,li,380);
  
  line(62,290,62,410);   // left brick
  line(122,290,122,410);
  line(182,290,182,410);
  
  line(585,290,585,410); //right brick
  line(650,290,650,410);
  
  line(lr,318,710,318); //right brick
  line(lr,348,710,348);
  line(lr,380,710,380);
  
  
//   eyeX = map(mouseX,0,width,-6,6,1);
//   eyeY = map(mouseY,0,height,-3,3,1);
  
  
//   // eye 
//   fill(255,255,225);
//   ellipse(376.5,38,38,20);
//   fill(0,0,0);
//   ellipse(376+eyeX,38+eyeY,12);
  
// control the sun movenments and rotate a small square with the map function using angle acceleration and angle velocity.
push();
  angleA = map(mouseX,0,width,0.00,0.06);
  angleV = map(mouseX,0,width,0.00,0.05);
  fill(80,80,92);
  translate(377,79);
  rotate(angle);
  rectMode(CENTER)
  rect(0,0,23,23)
  
  angle += angleV;
  angleV += angleA; // Acceleration plus Velocity plus angle
pop();
}  
  // updates the x positions of the door and loops back to original value

function updateDoorPositions() {
  // Calculate positions based on percentages of window size
  xx = windowWidth * 0.1;
  xxx = windowWidth * 0.7;
  li = windowWidth * 0.1;
  lr = windowWidth * 0.9;
}

// updates the x positions of the door and loops back to original value
function closeAndOpenDoor() {
  xx += 25;
  xxx -= 25;
  li += 24;
  lr -= 24;
  if (xx >= windowWidth * 0.15 && xxx <= windowWidth * 0.85) {
    xx = windowWidth * 0.1;
    xxx = windowWidth * 0.7;
    li = windowWidth * 0.1;
    lr = windowWidth * 0.9;
  }
}
