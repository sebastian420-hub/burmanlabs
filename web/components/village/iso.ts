/**
 * The Village map, drawn as an angled (isometric) 2D scene on a canvas.
 * Pure drawing: it knows nothing about playback, React or the trace file, so
 * a richer renderer (a 3D one later) can replace it behind the same Scene.
 */
import type { Cast, TraceObject } from "@/lib/villageTrace";

export interface SceneAgent {
  id: string;
  x: number; // tile coords, may be fractional while walking
  y: number;
  collapsed?: boolean;
  talking?: boolean;
}
export interface SceneLink { from: string; to: string; kind: "trade" | "teach" }
export interface Scene {
  size: number;
  terrain: string[];
  cast: Cast;
  agents: SceneAgent[];
  objects: TraceObject[];
  resources: [number, number, string, number][];
  time: string; // time_of_day
  links: SceneLink[];
  selected?: string | null;
  highlight?: string[];
  /** Where people have died, marked with a small stone. */
  graves?: { x: number; y: number }[];
  /** Where a moment happened, ringed on the ground. */
  spot?: { x: number; y: number } | null;
  /** Seconds, for pulsing rings. */
  clock: number;
}
export interface Camera { x: number; y: number; zoom: number } // centre in tile coords; zoom = px per tile width

export const ROLE: Record<string, string> = { explorer: "#7fb4d8", builder: "#e0a458", gatherer: "#8fbf7f", scholar: "#b99ad6" };
const NIGHT: Record<string, number> = { night: 0.5, evening: 0.25, morning: 0.06, afternoon: 0 };

// Ground: calm and close in value, so the people and buildings carry the picture.
const GROUND: Record<string, string> = { p: "#323b27", f: "#2b3522", m: "#3a3a30", w: "#1e3346" };

function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Tile (x, y) -> screen px, for a canvas of css size w x h. */
export function project(cam: Camera, w: number, h: number, x: number, y: number) {
  const tw = cam.zoom, th = cam.zoom / 2;
  return {
    sx: w / 2 + ((x - y) - (cam.x - cam.y)) * (tw / 2),
    sy: h / 2 + ((x + y) - (cam.x + cam.y)) * (th / 2),
  };
}

/** Zoom that fits the whole map in a w x h canvas. */
export function fitZoom(size: number, w: number, h: number) {
  return Math.min(w / (size + 1), (2 * h) / (size + 2));
}

export function draw(g: CanvasRenderingContext2D, w: number, h: number, cam: Camera, s: Scene) {
  const tw = cam.zoom, th = cam.zoom / 2, detail = tw >= 14;
  const P = (x: number, y: number) => project(cam, w, h, x, y);
  g.fillStyle = "#0b0a09";
  g.fillRect(0, 0, w, h);

  // Ground, back to front. Tiles are drawn from their centre (x+.5, y+.5).
  const diamond = (cx: number, cy: number, lift = 0) => {
    g.beginPath();
    g.moveTo(cx, cy - th / 2 - lift);
    g.lineTo(cx + tw / 2, cy - lift);
    g.lineTo(cx, cy + th / 2 - lift);
    g.lineTo(cx - tw / 2, cy - lift);
    g.closePath();
  };
  for (let d = 0; d < s.size * 2 - 1; d++) {
    for (let x = Math.max(0, d - s.size + 1); x <= Math.min(d, s.size - 1); x++) {
      const y = d - x;
      const { sx, sy } = P(x + 0.5, y + 0.5);
      if (sx < -tw || sx > w + tw || sy < -tw || sy > h + tw) continue;
      const k = s.terrain[y]?.[x] ?? "p";
      const j = 0.94 + hash(x, y) * 0.12;
      if (k === "m") {
        const lift = th * (0.18 + hash(y, x) * 0.22);
        g.fillStyle = shade("#2a2b23", j);
        g.beginPath(); g.moveTo(sx - tw / 2, sy); g.lineTo(sx, sy + th / 2); g.lineTo(sx + tw / 2, sy);
        g.lineTo(sx + tw / 2, sy - lift); g.lineTo(sx, sy + th / 2 - lift); g.lineTo(sx - tw / 2, sy - lift); g.closePath(); g.fill();
        diamond(sx, sy, lift); g.fillStyle = shade(GROUND.m, j); g.fill();
      } else {
        diamond(sx, sy); g.fillStyle = shade(GROUND[k] ?? GROUND.p, j); g.fill();
        if (k === "w" && detail) {
          g.strokeStyle = "rgba(140,180,210,.12)"; g.lineWidth = 1;
          g.beginPath(); g.moveTo(sx - tw * 0.18, sy); g.lineTo(sx + tw * 0.12, sy); g.stroke();
        }
      }
      if (k === "f" && detail) {
        const n = 1 + Math.floor(hash(x + 7, y) * 2);
        for (let t = 0; t < n; t++) {
          const ox = (hash(x, y + t * 3) - 0.5) * tw * 0.4, oy = (hash(x + t, y) - 0.5) * th * 0.4;
          const tx = sx + ox, ty = sy + oy, r = tw * 0.13;
          g.fillStyle = "#1d2617"; g.beginPath(); g.moveTo(tx - r, ty); g.lineTo(tx, ty - r * 3.2); g.lineTo(tx + r, ty); g.closePath(); g.fill();
          g.fillStyle = "#33452a"; g.beginPath(); g.moveTo(tx - r * 0.1, ty); g.lineTo(tx, ty - r * 3.2); g.lineTo(tx + r, ty); g.closePath(); g.fill();
        }
      }
    }
  }

  // Everything standing on the ground, sorted by depth.
  type Item = { depth: number; paint: () => void };
  const items: Item[] = [];
  for (const [x, y, type, amt] of s.resources) {
    items.push({ depth: x + y, paint: () => resource(g, P(x + 0.5, y + 0.5), type, amt, tw, detail) });
  }
  for (const gr of s.graves ?? []) {
    items.push({ depth: gr.x + gr.y + 0.05, paint: () => grave(g, P(gr.x + 0.85, gr.y + 0.35), tw) });
  }
  const perTile: Record<string, number> = {};
  for (const o of s.objects) {
    const key = `${o.x},${o.y}`, slot = (perTile[key] = (perTile[key] ?? 0) + 1) - 1;
    const shared = s.objects.filter((p) => p.x === o.x && p.y === o.y).length;
    const off = shared > 1 ? (slot - (shared - 1) / 2) * 0.55 : 0;
    items.push({ depth: o.x + o.y + 0.1, paint: () => building(g, P(o.x + 0.5 + off, o.y + 0.5 - off), o.type, tw) });
  }
  const pos: Record<string, { sx: number; sy: number }> = {};
  for (const a of s.agents) pos[a.id] = P(a.x + 0.5, a.y + 0.5);
  const focus = new Set([...(s.highlight ?? []), ...(s.selected ? [s.selected] : [])]);
  for (const a of s.agents) {
    items.push({ depth: a.x + a.y + 0.2, paint: () => person(g, pos[a.id], a, ROLE[s.cast[a.id]?.role] ?? "#f2efe9", tw) });
  }
  items.sort((p, q) => p.depth - q.depth).forEach((i) => i.paint());

  // Night falls over the land; windows and people's rings stay readable.
  const dark = NIGHT[s.time] ?? 0;
  if (dark) {
    g.fillStyle = `rgba(6,8,20,${dark})`;
    g.fillRect(0, 0, w, h);
    if (dark > 0.2) {
      for (const o of s.objects) {
        if (o.type === "well") continue;
        const { sx, sy } = P(o.x + 0.5, o.y + 0.5);
        const r = tw * 0.9, glow = g.createRadialGradient(sx, sy - tw * 0.2, 0, sx, sy - tw * 0.2, r);
        glow.addColorStop(0, "rgba(255,190,110,.35)"); glow.addColorStop(1, "rgba(255,190,110,0)");
        g.fillStyle = glow; g.fillRect(sx - r, sy - tw * 0.2 - r, r * 2, r * 2);
      }
    }
  }

  if (s.spot) {
    const { sx, sy } = P(s.spot.x + 0.5, s.spot.y + 0.5);
    const p = (s.clock % 1.6) / 1.6;
    g.strokeStyle = `rgba(201,164,92,${0.9 - p * 0.8})`; g.lineWidth = 2;
    g.beginPath(); g.ellipse(sx, sy, tw * (0.5 + p * 1.2), th * (0.5 + p * 1.2), 0, 0, Math.PI * 2); g.stroke();
  }

  // Exchanges between two people: an arc from giver to receiver.
  for (const l of s.links) {
    const a = pos[l.from], b = pos[l.to];
    if (!a || !b) continue;
    const lift = Math.max(tw * 0.7, 14);
    g.strokeStyle = l.kind === "trade" ? "#c9a45c" : "#b99ad6"; g.lineWidth = 2; g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(a.sx, a.sy - lift);
    g.quadraticCurveTo((a.sx + b.sx) / 2, Math.min(a.sy, b.sy) - lift * 2.2, b.sx, b.sy - lift); g.stroke();
    g.setLineDash([]);
  }

  for (const a of s.agents) {
    const p = pos[a.id], r = Math.max(tw * 0.45, 9);
    if (focus.has(a.id)) {
      const pulse = 1 + 0.12 * Math.sin(s.clock * 5);
      g.strokeStyle = a.id === s.selected ? "#f2efe9" : "#c9a45c"; g.lineWidth = 2;
      g.beginPath(); g.ellipse(p.sx, p.sy, r * pulse, r * 0.5 * pulse, 0, 0, Math.PI * 2); g.stroke();
    }
    if (a.talking && detail) bubble(g, p.sx + tw * 0.25, p.sy - Math.max(tw * 0.95, 18));
  }

  // Names: everyone when there is room, otherwise just the people in focus.
  g.font = "500 11px ui-sans-serif, system-ui, sans-serif";
  g.textAlign = "center"; g.textBaseline = "middle";
  for (const a of s.agents) {
    if (!(tw >= 20 || focus.has(a.id))) continue;
    const p = pos[a.id], name = s.cast[a.id]?.name ?? "", y = p.sy + Math.max(tw * 0.32, 9);
    const m = g.measureText(name).width + 10;
    g.fillStyle = focus.has(a.id) ? "rgba(242,239,233,.95)" : "rgba(11,10,9,.72)";
    g.beginPath(); g.roundRect(p.sx - m / 2, y - 8, m, 16, 8); g.fill();
    g.fillStyle = focus.has(a.id) ? "#0b0a09" : "#f2efe9";
    g.fillText(name, p.sx, y + 0.5);
  }
}

function resource(g: CanvasRenderingContext2D, { sx, sy }: { sx: number; sy: number }, type: string, amt: number, tw: number, detail: boolean) {
  const k = Math.min(1, 0.45 + amt / 20);
  if (!detail) {
    g.fillStyle = type === "food" ? "#c9a45c" : type === "materials" ? "#8a5f3c" : "#9a948b";
    g.beginPath(); g.arc(sx, sy, Math.max(1.5, tw * 0.12 * k), 0, Math.PI * 2); g.fill();
    return;
  }
  const u = tw * 0.22 * k;
  if (type === "food") {
    g.fillStyle = "#3d5a2e"; g.beginPath(); g.ellipse(sx, sy - u * 0.6, u * 1.2, u * 0.9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#d9b45f";
    for (const [dx, dy] of [[-0.5, -0.9], [0.4, -0.7], [0, -0.3]]) { g.beginPath(); g.arc(sx + dx * u, sy + dy * u, Math.max(1.2, u * 0.22), 0, Math.PI * 2); g.fill(); }
  } else if (type === "materials") {
    g.fillStyle = "#7a5233"; g.strokeStyle = "#4a3120"; g.lineWidth = 1;
    for (let i = 0; i < 2; i++) { g.beginPath(); g.roundRect(sx - u * 1.1, sy - u * (0.5 + i * 0.55), u * 2.2, u * 0.5, u * 0.25); g.fill(); g.stroke(); }
  } else {
    g.fillStyle = "#8d877e"; g.beginPath();
    g.moveTo(sx - u, sy); g.lineTo(sx - u * 0.6, sy - u * 0.9); g.lineTo(sx + u * 0.3, sy - u * 1.1); g.lineTo(sx + u, sy - u * 0.2); g.lineTo(sx + u * 0.6, sy + u * 0.2); g.closePath(); g.fill();
    g.fillStyle = "#a8a299"; g.beginPath(); g.moveTo(sx - u * 0.6, sy - u * 0.9); g.lineTo(sx + u * 0.3, sy - u * 1.1); g.lineTo(sx, sy - u * 0.4); g.closePath(); g.fill();
  }
}

/** An iso box of footprint f (tile fraction) and height h px, at ground point (sx, sy). */
function box(g: CanvasRenderingContext2D, sx: number, sy: number, tw: number, f: number, h: number, wall: string) {
  const hw = (tw / 2) * f, hh = (tw / 4) * f;
  g.fillStyle = shade(wall, 0.72); // left face
  g.beginPath(); g.moveTo(sx - hw, sy); g.lineTo(sx, sy + hh); g.lineTo(sx, sy + hh - h); g.lineTo(sx - hw, sy - h); g.closePath(); g.fill();
  g.fillStyle = shade(wall, 0.9); // right face
  g.beginPath(); g.moveTo(sx + hw, sy); g.lineTo(sx, sy + hh); g.lineTo(sx, sy + hh - h); g.lineTo(sx + hw, sy - h); g.closePath(); g.fill();
  return { hw, hh, top: sy - h };
}

function pyramid(g: CanvasRenderingContext2D, sx: number, top: number, hw: number, hh: number, rise: number, roof: string) {
  g.fillStyle = shade(roof, 0.8);
  g.beginPath(); g.moveTo(sx - hw, top); g.lineTo(sx, top + hh); g.lineTo(sx, top - rise); g.closePath(); g.fill();
  g.fillStyle = roof;
  g.beginPath(); g.moveTo(sx + hw, top); g.lineTo(sx, top + hh); g.lineTo(sx, top - rise); g.closePath(); g.fill();
}

function building(g: CanvasRenderingContext2D, { sx, sy }: { sx: number; sy: number }, type: string, tw: number) {
  const u = tw;
  if (type === "well") {
    g.fillStyle = "#6f6a63"; g.beginPath(); g.ellipse(sx, sy, u * 0.3, u * 0.15, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#8d877e"; g.fillRect(sx - u * 0.3, sy - u * 0.14, u * 0.6, u * 0.14);
    g.beginPath(); g.ellipse(sx, sy - u * 0.14, u * 0.3, u * 0.15, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#2c5a7a"; g.beginPath(); g.ellipse(sx, sy - u * 0.14, u * 0.2, u * 0.09, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#6b4a30"; g.lineWidth = Math.max(1, u * 0.04);
    g.beginPath(); g.moveTo(sx - u * 0.24, sy - u * 0.14); g.lineTo(sx - u * 0.24, sy - u * 0.5); g.moveTo(sx + u * 0.24, sy - u * 0.14); g.lineTo(sx + u * 0.24, sy - u * 0.5); g.stroke();
    g.fillStyle = "#7a3a2a"; g.beginPath(); g.moveTo(sx - u * 0.34, sy - u * 0.46); g.lineTo(sx, sy - u * 0.66); g.lineTo(sx + u * 0.34, sy - u * 0.46); g.closePath(); g.fill();
  } else if (type === "granary") {
    const b = box(g, sx, sy, u, 0.75, u * 0.45, "#b08a5a");
    pyramid(g, sx, b.top, b.hw, b.hh, u * 0.4, "#8a4f2e");
  } else if (type === "market") {
    g.strokeStyle = "#6b4a30"; g.lineWidth = Math.max(1, u * 0.04);
    const hw = u * 0.36, hh = u * 0.18, top = sy - u * 0.42;
    g.beginPath();
    for (const [dx, dy] of [[-hw, 0], [hw, 0], [0, -hh], [0, hh]]) { g.moveTo(sx + dx, sy + dy); g.lineTo(sx + dx, top + dy); }
    g.stroke();
    for (let i = 0; i < 4; i++) { // striped awning
      g.fillStyle = i % 2 ? "#f2efe9" : "#ff3131";
      const a = i / 4, b = (i + 1) / 4;
      g.beginPath();
      g.moveTo(sx - hw + a * hw, top - a * hh); g.lineTo(sx - hw + b * hw, top - b * hh);
      g.lineTo(sx + b * hw, top + hh - b * hh); g.lineTo(sx + a * hw, top + hh - a * hh); g.closePath(); g.fill();
    }
    g.fillStyle = "#c9a45c"; g.fillRect(sx - u * 0.12, sy - u * 0.12, u * 0.24, u * 0.1);
  } else if (type === "library") {
    const b = box(g, sx, sy, u, 0.8, u * 0.5, "#8d867c");
    g.strokeStyle = "rgba(242,239,233,.35)"; g.lineWidth = 1;
    for (const f of [0.3, 0.6]) { g.beginPath(); g.moveTo(sx + b.hw * f, sy + b.hh * (1 - f)); g.lineTo(sx + b.hw * f, sy + b.hh * (1 - f) - u * 0.5); g.stroke(); }
    pyramid(g, sx, b.top, b.hw * 1.05, b.hh * 1.05, u * 0.28, "#4a4340");
  } else {
    // house (and anything new the engine invents: a plain house shape)
    const b = box(g, sx, sy, u, 0.6, u * 0.32, "#c2a27a");
    pyramid(g, sx, b.top, b.hw * 1.1, b.hh * 1.1, u * 0.34, type === "house" ? "#a13d2c" : "#6e6963");
    g.fillStyle = "#3a2a1c"; g.fillRect(sx + b.hw * 0.35, sy + b.hh * 0.2 - u * 0.18, u * 0.08, u * 0.16);
  }
}

function person(g: CanvasRenderingContext2D, { sx, sy }: { sx: number; sy: number }, a: SceneAgent, colour: string, tw: number) {
  const u = Math.max(tw, 9);
  g.fillStyle = "rgba(0,0,0,.35)";
  g.beginPath(); g.ellipse(sx, sy, u * 0.2, u * 0.1, 0, 0, Math.PI * 2); g.fill();
  if (a.collapsed) {
    g.fillStyle = colour; g.beginPath(); g.ellipse(sx, sy - u * 0.06, u * 0.24, u * 0.09, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#ff3131"; g.lineWidth = 1.5; g.stroke();
    return;
  }
  if (tw < 14) {
    g.fillStyle = colour; g.strokeStyle = "#0b0a09"; g.lineWidth = 1.5;
    g.beginPath(); g.arc(sx, sy - 3, 4, 0, Math.PI * 2); g.fill(); g.stroke();
    return;
  }
  g.fillStyle = colour;
  g.beginPath(); g.roundRect(sx - u * 0.11, sy - u * 0.5, u * 0.22, u * 0.46, u * 0.1); g.fill();
  g.fillStyle = "#e6cfae";
  g.beginPath(); g.arc(sx, sy - u * 0.58, u * 0.1, 0, Math.PI * 2); g.fill();
}

function bubble(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = "rgba(242,239,233,.92)";
  g.beginPath(); g.roundRect(x - 11, y - 7, 22, 14, 7); g.fill();
  g.beginPath(); g.moveTo(x - 5, y + 6); g.lineTo(x - 8, y + 11); g.lineTo(x - 1, y + 6); g.fill();
  g.fillStyle = "#0b0a09";
  for (const d of [-5, 0, 5]) { g.beginPath(); g.arc(x + d, y, 1.4, 0, Math.PI * 2); g.fill(); }
}

function grave(g: CanvasRenderingContext2D, { sx, sy }: { sx: number; sy: number }, tw: number) {
  const u = Math.max(tw, 10);
  g.fillStyle = "rgba(0,0,0,.35)";
  g.beginPath(); g.ellipse(sx, sy, u * 0.16, u * 0.07, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#9a948b";
  g.beginPath(); g.roundRect(sx - u * 0.09, sy - u * 0.3, u * 0.18, u * 0.3, [u * 0.09, u * 0.09, 1, 1]); g.fill();
  g.strokeStyle = "#5c5853"; g.lineWidth = 1;
  g.beginPath(); g.moveTo(sx, sy - u * 0.24); g.lineTo(sx, sy - u * 0.1); g.moveTo(sx - u * 0.045, sy - u * 0.19); g.lineTo(sx + u * 0.045, sy - u * 0.19); g.stroke();
}
