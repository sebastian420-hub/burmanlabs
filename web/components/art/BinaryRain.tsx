"use client";

import { useEffect, useRef } from "react";
import { artLoop } from "@/lib/artLoop";

/**
 * "Binary Rain" — port of Portfolio/one.js (p5.js) to Canvas 2D.
 * Ones and zeros fall through the original red field (252, 50, 0). The original
 * drew 160 digits in a 100 px strip; here density and type size scale with the
 * stage, and digits fall at three depths. Tap toggles the original slow/fast modes.
 */
interface Drop {
  x: number;
  y: number;
  v: number;
  ch: "0" | "1";
  depth: number; // 0.6 – 1.4
}

export default function BinaryRain() {
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

    let slow = true; // the original `boolean`, true at start
    let drops: Drop[] = [];
    let w = 0;
    let h = 0;
    let size = 14;

    const speedFor = (ch: Drop["ch"]) => {
      if (slow) return (1 + Math.random()) * 2; // random(1, 2), applied twice per frame
      return ch === "1" ? 5 + Math.random() * 3 : 3 + Math.random() * 2;
    };
    const make = (y?: number): Drop => {
      const ch = Math.random() < 0.5 ? "1" : "0";
      return {
        x: Math.random() * w,
        y: y ?? -20,
        v: speedFor(ch),
        ch,
        depth: 0.6 + Math.random() * 0.8,
      };
    };

    const loop = artLoop(host, {
      onResize(cw, ch, dpr) {
        w = cw;
        h = ch;
        canvas.width = Math.round(cw * dpr);
        canvas.height = Math.round(ch * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        size = Math.max(12, Math.min(26, Math.min(cw, ch) / 26));
        const n = Math.min(520, Math.round((cw * ch) / (size * size * 5)));
        drops = Array.from({ length: n }, () => make(Math.random() * ch));
        drops.sort((a, b) => a.depth - b.depth);
      },
      frame(_t, dt) {
        const k = (dt * 60 * size) / 12;
        ctx.fillStyle = "rgb(252,50,0)";
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = "center";
        for (const d of drops) {
          d.y += d.v * d.depth * k;
          if (d.y > h + 20) Object.assign(d, make(), { depth: d.depth });
          const s = size * d.depth;
          ctx.font = `${s}px ui-monospace, "SF Mono", Menlo, monospace`;
          ctx.globalAlpha = 0.35 + (d.depth - 0.6) * 0.8;
          ctx.fillStyle = d.depth > 1.25 ? "#fff3ee" : "#1a0400";
          ctx.fillText(d.ch, d.x, d.y);
        }
        ctx.globalAlpha = 1;
      },
    });

    const onTap = () => {
      slow = !slow;
      for (const d of drops) d.v = speedFor(d.ch);
      loop.redraw();
    };
    canvas.addEventListener("click", onTap);

    return () => {
      loop.stop();
      canvas.removeEventListener("click", onTap);
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0" style={{ background: "rgb(252,50,0)" }} />;
}
