let x;
let y;
let xx = 137;
let boolean = false;
let currentFrame = 0;

function sketch(p) {
  p.setup = function() {
    let canvas = p.createCanvas(265, 250);
    canvas.parent('sketch2'); // Attach canvas to the sketch2 div
}

  p.draw = function() {
    p.background(255, 255, 255);

    x = p.map(p.mouseX, 0, p.width, -3, 3.2, 1);
    y = p.map(p.mouseY, 0, p.width, -1.8, 1, 1);

    if (!boolean) {
      if (currentFrame >= 300) {
        xx = 137;
        currentFrame += 20;
        if (currentFrame >= delayFrames) {
          xx = 120.5;
          currentFrame = 0;
        }
      } else {
        currentFrame++;
        console.log(currentFrame);
      }
    }

    p.push();
    p.fill(0);
    p.ellipse(132, 120, 200, 200);
    p.fill(229, 155, 125);
    p.beginShape();
    p.curveVertex(136, 119);
    p.curveVertex(52, 95);
    p.curveVertex(65, 149);
    p.curveVertex(198, 149);
    p.curveVertex(215, 95);
    p.endShape(p.CLOSE);
    p.pop();

    p.beginShape(p.CLOSE);
    p.curveVertex(120, 158);
    p.curveVertex(137, 144);
    p.curveVertex(156, 158);
    p.curveVertex(120, 158);
    p.curveVertex(137, 144);
    p.endShape(p.CLOSE);

    eyeOne = new eyeRight(10, 20, 10, xx, 173.7, 40);
    eyeTwo = new eyeRight(220, 220, 220, 137, 167, 43);
    eyePupilOne = new eyePupil(15, 15, 99, 78, 52);
    eyePupilTwo = new eyePupil(5.5, 5.5, 0, 0, 0);
    eyeTwo.show();
    eyePupilOne.display();
    eyePupilTwo.display();
    eyeOne.show();

    eyeOneOne = new eyeLeft(10, 20, 10, xx, 173.7, 40);
    eyeTwoTwo = new eyeLeft(220, 220, 220, 137, 167, 43);
    eyePupilOnee = new eyePupill(15, 15, 99, 78, 52);
    eyePupilTwoo = new eyePupill(5.5, 5.5, 0, 0, 0);
    eyeTwoTwo.show();
    eyePupilOnee.display();
    eyePupilTwoo.display();
    eyeOneOne.show();

    let mouseXCoord = p.mouseX;
    let mouseYCoord = p.mouseY;

    // Log the x and y coordinates in the console
    console.log("X Coordinate: " + mouseXCoord);
    console.log("Y Coordinate: " + mouseYCoord);
  };

  class eyeRight {
    constructor(r, g, b, x, y, position) {
      this.red = r;
      this.green = g;
      this.blue = b;
      this.x = x;
      this.y = y;
      this.position = position;
    }

    show() {
      p.fill(this.red, this.green, this.blue);
      p.stroke(0, 0, 0);
      p.strokeWeight(0.5);

      p.beginShape(p.CLOSE);
      p.curveVertex(160, 131);
      p.curveVertex(160, 129);
      p.curveVertex(183, 117);
      p.curveVertex(205, 128);
      p.curveVertex(183, this.x);
      p.endShape(p.CLOSE);
    }
  }

  class eyeLeft {
    constructor(r, g, b, x, y, position) {
      this.red = r;
      this.green = g;
      this.blue = b;
      this.x = x;
      this.y = y;
      this.position = position;
    }

    show() {
      p.fill(this.red, this.green, this.blue);
      p.stroke(0, 0, 0);
      p.strokeWeight(0.5);

      p.beginShape(p.CLOSE);
      p.curveVertex(110, 131);
      p.curveVertex(110, 129);
      p.curveVertex(85, 117);
      p.curveVertex(62, 128);
      p.curveVertex(85, this.x);
      p.endShape(p.CLOSE);
    }
  }

  class eyePupil {
    constructor(w, h, r, g, b) {
      this.w = w;
      this.h = h;
      this.r = r;
      this.g = g;
      this.b = b;
    }
    display() {
      p.fill(this.r, this.g, this.b);
      p.ellipse(182 + x, 128 + y, this.w, this.h);
    }
  }
  class eyePupill {
    constructor(w, h, r, g, b) {
      this.w = w;
      this.h = h;
      this.r = r;
      this.g = g;
      this.b = b;
    }
    display() {
      p.fill(this.r, this.g, this.b);
      p.ellipse(85 + x, 128 + y, this.w, this.h);
    }
  }
}

new p5(sketch, 'sketch2');
