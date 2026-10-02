"use client";

import { useEffect, useRef } from "react";
import { artLoop, relPointer } from "@/lib/artLoop";

/**
 * "Mandalay Palace" — port of Portfolio/mandalay.js (p5.js) to plain Canvas 2D.
 * The original 700×500 drawing, unchanged, shown as a framed piece:
 * - the sun (then the moon) orbits; each full turn swaps day and night
 * - pointer position along the drawing sets the speed (as mouseX did)
 * - tapping opens the gates a step, as the original mouseOver did
 */
const W = 700;
const H = 500;
const SUN = [[255, 100, 19], [246, 241, 213]];
const SKY = [[205, 240, 255], [44, 26, 64]];
const rgb = (c: number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const CREAM = "rgb(240,230,150)";
const BRICK = "rgb(188,74,60)";

export default function Mandalay() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:manipulation;cursor:pointer";
    host.appendChild(canvas);
    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;
    const ctx = maybeCtx;

    // Original state.
    let xx = 220;
    let xxx = 398;
    let li = 220;
    let lr = 528;
    let angle = 0;
    let dataP = 0;
    let pointerX = W * 0.25; // no mouse on phones: start with a gentle orbit

    let scale = 1;
    let ox = 0;
    let oy = 0;
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    // ---- tiny p5-style helpers (CORNER rects, CENTER ellipses, 1px black stroke) ----
    let fill: string | null = CREAM;
    let stroke = true;
    const paint = () => {
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) ctx.stroke();
    };
    const rect = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      paint();
    };
    const ellipse = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
      paint();
    };
    const poly = (...pts: number[]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.closePath();
      paint();
    };
    const arcTop = (x: number, y: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.ellipse(x, y, w / 2, h / 2, 0, Math.PI, Math.PI * 2);
      ctx.closePath();
      paint();
    };
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    function drawPiece() {
      const sky = SKY[dataP % 2];
      ctx.fillStyle = rgb(sky);
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;

      // Orbit centre and the sun/moon.
      fill = CREAM;
      stroke = true;
      ctx.save();
      ctx.translate(W / 2 + 25, H / 2 - 25);
      ellipse(0, 0, 10, 10);
      ctx.save();
      fill = rgb(SUN[dataP % 2]);
      ctx.rotate(angle);
      ctx.translate(W / 4 + 80, 99);
      ellipse(0, 0, 90, 90);
      ctx.restore();
      ctx.restore();

      fill = "rgb(65,155,10)";
      rect(1, 350, 700, 180);

      // Side towers with cross-shaped windows (sky shows through).
      fill = BRICK;
      stroke = false;
      for (const x of [20, 130, 580, 680]) rect(x, 250, 65, 140);
      for (const x of [52.5, 162.5, 612.5, 712.5]) arcTop(x, 250, 65, 75);
      fill = rgb(sky);
      for (const [x, y] of [[35, 46], [145, 157], [595, 607]]) {
        rect(x, 240, 35, 12);
        rect(y, 228, 12, 35);
      }

      // Pillars, walls and the two gates.
      fill = BRICK;
      stroke = true;
      for (const x of [282, 323, 412, 453]) rect(x, 200, 15, 160);
      for (const x of [255, 295, 425, 465]) rect(x, 250, 30, 180);
      rect(1, 290, 260, 120);
      rect(500, 290, 260, 120);
      rect(xx, 275, 130, 150);
      rect(xxx, 275, 130, 150);

      // The tiered roof (pyatthat) and spire.
      fill = CREAM;
      poly(255, 250, 285, 250, 269, 215);
      poly(295, 250, 325, 250, 310, 215);
      poly(425, 250, 455, 250, 439, 215);
      poly(465, 250, 495, 250, 479, 215);
      rect(322, 184, 110, 28);
      poly(270, 170, 490, 170, 484, 190, 276, 190);
      poly(210, 235, 550, 235, 560, 180, 375, 200, 200, 180);
      poly(330, 130, 425, 130, 490, 170, 270, 170);
      poly(350, 100, 405, 100, 465, 140, 290, 140);
      poly(365, 40, 388, 40, 388, 45, 376, 60, 365, 45);
      poly(365, 40, 388, 40, 388, 35, 376, 1, 365, 35);
      rect(350, 60, 55, 40);

      // Brick courses.
      for (const y of [318, 348, 380]) line(0, y, li, y);
      for (const x of [62, 122, 182]) line(x, 290, x, 410);
      for (const x of [585, 650]) line(x, 290, x, 410);
      for (const y of [318, 348, 380]) line(lr, y, 710, y);

      // The spinning square at the top of the spire.
      ctx.save();
      fill = "rgb(80,80,92)";
      ctx.translate(377, 79);
      ctx.rotate(angle);
      rect(-11.5, -11.5, 23, 23);
      ctx.restore();
    }

    const loop = artLoop(host, {
      onResize(w, h, d) {
        cssW = w;
        cssH = h;
        dpr = d;
        canvas.width = Math.round(w * d);
        canvas.height = Math.round(h * d);
        const pad = Math.min(w, h) * 0.08;
        scale = Math.min((w - pad * 2) / W, (h - pad * 2) / H);
        ox = (w - W * scale) / 2;
        oy = (h - H * scale) / 2;
      },
      frame(_t, dt) {
        // Same speed law as the original (map(mouseX, 0, width, 0, 0.05) per frame).
        angle += (pointerX / W) * 0.05 * dt * 60;
        if (angle >= Math.PI * 2) {
          dataP++;
          angle = 0;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        drawPiece();
        ctx.restore();
      },
    });

    const onMove = (e: PointerEvent) => {
      const p = relPointer(canvas, e);
      const artX = (p.x * cssW - ox) / scale;
      pointerX = Math.max(0, Math.min(W, artX));
    };
    const onTap = () => {
      xx += 25;
      xxx -= 25;
      li += 24;
      lr -= 24;
      if (xx >= 246 && xxx >= 273) {
        xx = 220;
        xxx = 398;
        li = 220;
        lr = 528;
      }
      loop.redraw();
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("click", onTap);

    return () => {
      loop.stop();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onMove);
      canvas.removeEventListener("click", onTap);
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" />;
}
