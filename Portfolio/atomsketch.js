function sketch(p) {
    let a = 0;
    let b = 5;
    let angle = 0;
    let angleV = 1;
    let angleA = 1;
    let move;
    let anime = 0;
    let zero = false;
    let x = false;
    let one = false;
  
    let state = 300;
  
    p.setup = function() {
      p.createCanvas(windowWidth, windowHeight, p.WEBGL);
    };
  
    p.draw = function() {
      p.background(0, 0, 0);
  
      if (boolean) {
        anime++;
      }
  
      if (zero) {
        state = 500;
      } else {
        state = 300;
      }
  
      if (one) {
        state = 200;
      } else {
        state = 300;
      }
  
      if (anime > 150) {
        x = !x;
        if (!x) {
          a++;
        }
        if (anime > state) {
          a = 0;
          anime = 0;
        }
      }
  
      angle += angleV;
      angleV += angleA;
  
      p.translate(20, 0);
      p.push();
      p.fill(0, 0, 100);
      p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
      p.rotateZ(angle);
      p.rotateX(p.frameCount * 0.00);
      p.rotateY(p.frameCount * 0.04);
  
      p.torus(200, b);
      p.pop();
  
      p.translate(0, 0);
  
      p.push();
      p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
      p.rotateZ(p.frameCount * 0.004);
      p.rotateX(p.frameCount * p.random(0.01, 0.02));
      p.rotateY(p.frameCount * 0.02);
  
      p.torus(a, b);
      p.pop();
  
      p.translate(0, 0);
  
      p.push();
      p.stroke(p.random(0, 255), p.random(0, 25), p.random(0, 25));
      p.rotateZ(p.frameCount * 0.004);
      p.rotateX(p.frameCount * p.random(0.01, 0.04));
      p.rotateY(p.frameCount * 0.02);
  
      p.torus(a, b);
      p.pop();
  
      p.push();
      p.fill(255, 30, 80);
      p.noStroke();
      p.rotateZ(p.frameCount);
      p.rotateX(p.frameCount * p.random(0.01, 0.04));
      p.rotateY(p.frameCount);
  
      p.torus(5, 50);
      p.pop();
    };

    p.windowResized = function() {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  
    p.keyPressed = function() {
      if (p.keyCode === 75) {
        boolean = !boolean;
        console.log("Play" + " " + boolean);
      }
  
      if (p.keyCode === 72) {
        zero = !zero;
        console.log("High" + " " + zero);
      }
  
      if (p.keyCode === 76) {
        one = !one;
        console.log("Low" + " " + one);
      }
    };
  }
  
  new p5(sketch, 'sketch-container');
  