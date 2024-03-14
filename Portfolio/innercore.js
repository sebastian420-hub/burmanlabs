function sketch(p) {
  let a = 1;
  let b = 80;
  let angle = 0;
  let angleV = 1;
  let angleA = 1;
  let move;

  p.setup = function() {
    p.createCanvas(windowWidth, 800, p.WEBGL);
  };

  p.draw = function() {
    p.background(20);

    a = move;

    angle += angleV;
    angleV += angleA;

    p.translate(20, 0);
    p.push();
    p.fill(0, 0, 0);
    p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
    p.rotateZ(angle);
    p.rotateX(p.frameCount * 0.00);
    p.rotateY(p.frameCount * 0.01);

    p.torus(10, b);
    p.pop();

    move = p.map(p.mouseY, 0, p.height, 1, 500, 1);

    p.translate(5, 0);

    p.push();
    p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
    p.rotateZ(p.frameCount * 0.005);
    p.rotateX(p.frameCount * 0.00);
    p.rotateY(p.frameCount * 0.01);

    p.torus(a, b);
    p.pop();
  };

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}

new p5(sketch, 'sketch-container2');