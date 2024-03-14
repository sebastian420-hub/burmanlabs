function sketch(p) {
  let a = 0;
  let b = 5;
  let angle = 0;
  let angleV = 1;
  let angleA = 1;

  p.setup = function() {
    p.createCanvas(windowWidth, windowHeight, p.WEBGL);
  };

  p.draw = function() {
    p.background(0, 0, 0);

    a = p.move;

    angle += angleV; 
    angleV += angleA;

    p.translate(0, 0);
    p.push();
    p.fill(0, 0, 0);
    p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
    p.rotateZ(angle);
    p.rotateX(p.frameCount * 0.00);
    p.rotateY(p.frameCount * 0.01);

    p.torus(200, b);
    p.pop();

    p.translate(0, 0);
    p.push();
    p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
    p.rotateZ(p.frameCount * 0.5);
    p.rotateX(p.frameCount * p.random(0.01, 0.04));
    p.rotateY(p.frameCount * 0.02);

    p.torus(a, b);
    p.pop();

    p.translate(0, 0);
    p.push();
    p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
    p.rotateZ(p.frameCount * 0.5);
    p.rotateX(p.frameCount * p.random(0.01, 0.04));
    p.rotateY(p.frameCount * 0.02);

    p.torus(a, b);
    p.pop();
  };
}

new p5(sketch, 'sketch-container');