let a = 1;
let b = 80;
let angle = 0;
let angleV = 1;
let angleA = 1;
let move;

function setup() {
  createCanvas(windowWidth, 800, WEBGL);
}

function draw() {
  background(20);

  a = move;

  angle += angleV;
  angleV += angleA;

  translate(20, 0);
  push();
  fill(0, 0, 0);
  stroke(random(0, 255), random(0, 25), random(0, 25));
  rotateZ(angle);
  rotateX(frameCount * 0.00);
  rotateY(frameCount * 0.01);

  torus(10, b);
  pop();

  move = map(mouseY, 0, height, 1, 500, 1);

  translate(5, 0);
  push();
  stroke(random(0, 255), random(0, 25), random(0, 25));
  rotateZ(frameCount * 0.005);
  rotateX(frameCount * 0.00);
  rotateY(frameCount * 0.01);

  torus(a, b);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, 800);
}



