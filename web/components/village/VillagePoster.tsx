"use client";

/**
 * A still picture of The Village (the episode's last afternoon), drawn with the
 * replay's own renderer from the few KB the page already carries. No download,
 * no animation: it redraws only when its size changes.
 */
import { useEffect, useRef } from "react";
import type { Digest } from "@/lib/villageTrace";
import { draw, fitZoom } from "./iso";

export default function VillagePoster({ digest, className = "" }: { digest: Digest; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const paint = () => {
      const w = c.clientWidth, h = c.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      const g = c.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const p = digest.poster;
      const fit = fitZoom(digest.size, w, h);
      draw(g, w, h, { x: digest.size / 2, y: digest.size / 2, zoom: fit * (h / w > 0.85 ? 1.9 : 1.35) }, {
        size: digest.size, terrain: digest.terrain, cast: digest.cast,
        agents: p.agents.filter((a) => a.alive), objects: p.objects, resources: p.resources,
        time: p.time, links: [], clock: 0,
        graves: digest.moments.filter((m) => m.kind === "death").map((m) => ({ x: m.x, y: m.y })),
      });
    };
    const ro = new ResizeObserver(paint);
    ro.observe(c);
    return () => ro.disconnect();
  }, [digest]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
