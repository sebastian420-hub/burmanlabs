"use client";

/**
 * The Village replay, native to Burmanlabs: a canvas map of one episode's
 * trace (written by digital_sim's daily runner), tick by tick. Nothing
 * downloads until the visitor taps -- the trace is ~0.3 MB gzipped and is
 * unpacked in the browser.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { num } from "@/lib/i18n";

export interface ReplayLabels {
  start: string;
  startNote: string;
  loading: string;
  failed: string;
  play: string;
  pause: string;
  tick: string;
  day: string;
  tapHint: string;
  thinking: string;
  carrying: string;
  nothing: string;
  feed: string;
  roles: Record<string, string>;
}

type Agent = {
  id: string; x: number; y: number; alive: boolean; collapsed?: boolean;
  action: string; ok: boolean; msg: string; thought: string;
  inv?: Record<string, number>; energy?: number; water?: number;
  social?: { type?: string; with?: string; gave?: string; received?: string } | null;
};
type Tick = {
  tick: number; day: number; hour: number; time_of_day: string;
  agents: Agent[];
  resources: [number, number, string, number][];
  objects: { id: string; type: string; x: number; y: number }[];
  deaths: { id: string; name: string; cause: string }[];
  births?: { id: string; name: string; role: string; house_owner: string }[];
};
type Header = { size: number; terrain: string[]; agents: { id: string; name: string; role: string; alive?: boolean }[] };

const TERRAIN: Record<string, string> = { p: "#2b3420", f: "#1f2a1a", m: "#3a3531", w: "#1c2a38" };
const RESOURCE: Record<string, string> = { food: "#c9a45c", materials: "#9a6a43", stone: "#a39d94" };
const ROLE: Record<string, string> = { explorer: "#7fb4d8", builder: "#e0a458", gatherer: "#8fbf7f", scholar: "#b99ad6" };
const GLYPH: Record<string, string> = { well: "W", granary: "G", market: "M", library: "L", house: "H" };
const NIGHT: Record<string, number> = { night: 0.45, evening: 0.22, morning: 0.06, afternoon: 0 };
const PX = 960;

async function loadTrace(url: string): Promise<{ header: Header; ticks: Tick[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const bytes = new Uint8Array(await res.arrayBuffer());
  let text: string;
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    text = await new Response(stream).text();
  } else {
    text = new TextDecoder().decode(bytes); // the server already unpacked it
  }
  const lines = text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const header = lines.find((l) => l.kind === "header") as Header;
  const ticks = lines.filter((l) => l.kind === "tick") as Tick[];
  if (!header || !ticks.length) throw new Error("not a trace");
  return { header, ticks };
}

export default function VillageReplay({ url, lang, labels }: { url: string; lang: Locale; labels: ReplayLabels }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<{ header: Header; ticks: Tick[] } | null>(null);

  const start = useCallback(() => {
    setState("loading");
    loadTrace(url)
      .then((d) => { setData(d); setState("ready"); })
      .catch(() => setState("error"));
  }, [url]);

  if (state !== "ready" || !data) {
    return (
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl border border-line bg-ink-2 sm:aspect-[16/9]">
        <div className="text-center">
          {state === "idle" && (
            <>
              <button
                type="button"
                onClick={start}
                className="group inline-flex items-center gap-3 rounded-full bg-bone py-3 pr-7 pl-3 text-lg font-medium text-ink transition hover:bg-white"
              >
                <span className="grid size-9 place-items-center rounded-full bg-signal text-sm text-ink">▶</span>
                {labels.start}
              </button>
              <p className="mt-3 text-sm text-ash">{labels.startNote}</p>
            </>
          )}
          {state === "loading" && <p className="animate-pulse text-ash">{labels.loading}</p>}
          {state === "error" && <p className="text-signal">{labels.failed}</p>}
        </div>
      </div>
    );
  }
  return <Player data={data} lang={lang} labels={labels} />;
}

function Player({ data, lang, labels }: { data: { header: Header; ticks: Tick[] }; lang: Locale; labels: ReplayLabels }) {
  const { header, ticks } = data;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainRef = useRef<HTMLCanvasElement | null>(null);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [selected, setSelected] = useState<string | null>(null);

  const cast = useMemo(() => {
    const names: Record<string, { name: string; role: string }> = {};
    for (const a of header.agents) names[a.id] = { name: a.name, role: a.role };
    for (const t of ticks) for (const b of t.births ?? []) names[b.id] = { name: b.name, role: b.role };
    return names;
  }, [header, ticks]);

  const cell = PX / header.size;

  // Terrain is painted once, offscreen.
  useEffect(() => {
    const off = document.createElement("canvas");
    off.width = off.height = PX;
    const g = off.getContext("2d")!;
    header.terrain.forEach((row, y) => {
      for (let x = 0; x < header.size; x++) {
        g.fillStyle = TERRAIN[row[x]] ?? TERRAIN.p;
        g.fillRect(x * cell, y * cell, cell, cell);
      }
    });
    g.strokeStyle = "rgba(0,0,0,.25)";
    for (let k = 0; k <= header.size; k++) {
      g.beginPath(); g.moveTo(k * cell, 0); g.lineTo(k * cell, PX); g.moveTo(0, k * cell); g.lineTo(PX, k * cell); g.stroke();
    }
    terrainRef.current = off;
  }, [header, cell]);

  // Playback.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setI((k) => {
        if (k >= ticks.length - 1) { setPlaying(false); return k; }
        return k + 1;
      });
    }, 600 / speed);
    return () => window.clearInterval(id);
  }, [playing, speed, ticks.length]);

  const t = ticks[i];

  // Draw.
  useEffect(() => {
    const c = canvasRef.current, off = terrainRef.current;
    if (!c || !off) return;
    const g = c.getContext("2d")!;
    g.drawImage(off, 0, 0);
    for (const [x, y, type, amt] of t.resources) {
      const s = Math.max(3, Math.min(cell - 6, 3 + amt / 3));
      g.fillStyle = RESOURCE[type] ?? "#a39d94";
      g.fillRect(x * cell + (cell - s) / 2, y * cell + (cell - s) / 2, s, s);
    }
    const byTile: Record<string, string[]> = {};
    for (const o of t.objects) (byTile[`${o.x},${o.y}`] ??= []).push(GLYPH[o.type] ?? "?");
    g.textAlign = "center"; g.textBaseline = "middle";
    for (const key in byTile) {
      const [x, y] = key.split(",").map(Number), gs = byTile[key];
      g.fillStyle = "rgba(11,10,9,.8)"; g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      g.fillStyle = "#f2efe9"; g.font = `600 ${Math.max(9, cell * (gs.length > 1 ? 0.42 : 0.62))}px ui-sans-serif`;
      gs.forEach((ch, k) => g.fillText(ch, x * cell + (cell * (k + 0.5)) / gs.length, y * cell + cell / 2 + 1));
    }
    const shade = NIGHT[t.time_of_day] ?? 0;
    if (shade) { g.fillStyle = `rgba(5,6,14,${shade})`; g.fillRect(0, 0, PX, PX); }
    for (const a of t.agents) {
      if (!a.social?.with) continue;
      const other = t.agents.find((b) => cast[b.id]?.name === a.social!.with);
      if (!other) continue;
      g.strokeStyle = a.social.type?.endsWith("success") ? "#8fbf7f" : "rgba(242,239,233,.45)";
      g.lineWidth = 2; g.beginPath();
      g.moveTo(a.x * cell + cell / 2, a.y * cell + cell / 2); g.lineTo(other.x * cell + cell / 2, other.y * cell + cell / 2); g.stroke();
    }
    g.font = `500 ${Math.max(10, cell * 0.5)}px ui-sans-serif`; g.textBaseline = "top";
    for (const a of t.agents) {
      if (a.action === "death") continue;
      const cx = a.x * cell + cell / 2, cy = a.y * cell + cell / 2, r = cell * 0.34;
      g.fillStyle = ROLE[cast[a.id]?.role] ?? "#f2efe9";
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      if (a.collapsed) { g.strokeStyle = "#ff3131"; g.lineWidth = 3; g.stroke(); }
      if (a.id === selected) { g.strokeStyle = "#f2efe9"; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, r + 4, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = "#f2efe9"; g.fillText(cast[a.id]?.name ?? "", cx, cy + r + 2);
    }
  }, [t, cell, cast, selected]);

  const onMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * header.size);
    const y = Math.floor(((e.clientY - r.top) / r.height) * header.size);
    const hit = t.agents.find((a) => Math.abs(a.x - x) <= 1 && Math.abs(a.y - y) <= 1);
    setSelected(hit ? hit.id : null);
  };

  const sel = selected ? t.agents.find((a) => a.id === selected) : undefined;
  const feed = useMemo(() => {
    const out: { tick: number; text: string; tone: string }[] = [];
    for (let k = Math.max(0, i - 40); k <= i; k++) {
      const tk = ticks[k];
      for (const d of tk.deaths) out.push({ tick: tk.tick, text: `${d.name} ${d.cause}`, tone: "text-signal" });
      for (const b of tk.births ?? []) out.push({ tick: tk.tick, text: `${b.name} was born at ${b.house_owner}'s house`, tone: "text-gold" });
      for (const a of tk.agents) {
        const me = cast[a.id]?.name;
        if (a.social?.type === "trade_success") out.push({ tick: tk.tick, text: `${me} traded ${a.social.gave} to ${a.social.with} for ${a.social.received}`, tone: "text-bone" });
        else if (a.social?.type === "teach_success") out.push({ tick: tk.tick, text: `${me} taught ${a.social.with}`, tone: "text-bone" });
        else if (a.action === "build" && a.ok) out.push({ tick: tk.tick, text: `${me}: ${a.msg}`, tone: "text-gold" });
      }
    }
    return out.slice(-8).reverse();
  }, [i, ticks, cast]);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <canvas
          ref={canvasRef}
          width={PX}
          height={PX}
          onClick={onMapClick}
          className="block aspect-square w-full cursor-pointer rounded-3xl border border-line"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-full bg-bone px-5 py-2 text-sm font-medium text-ink transition hover:bg-white"
          >
            {playing ? `❚❚ ${labels.pause}` : `▶ ${labels.play}`}
          </button>
          {[1, 4, 16].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${speed === s ? "border-bone text-bone" : "border-line-2 text-ash hover:text-bone"}`}
            >
              ×{num(s, lang)}
            </button>
          ))}
          <input
            type="range"
            min={0}
            max={ticks.length - 1}
            value={i}
            onChange={(e) => { setPlaying(false); setI(Number(e.target.value)); }}
            className="min-w-40 flex-1 accent-[#ff3131]"
            aria-label={labels.tick}
          />
          <span className="num text-sm text-ash">
            {labels.tick} {num(t.tick, lang)} · {labels.day} {num(t.day, lang)}
          </span>
        </div>
      </div>
      <aside className="flex flex-col gap-4 lg:col-span-4">
        <div className="rounded-3xl border border-line bg-ink-2 p-5">
          {sel ? (
            <>
              <p className="display text-3xl">{cast[sel.id]?.name}</p>
              <p className="mt-1 text-sm text-ash">
                {labels.roles[cast[sel.id]?.role] ?? cast[sel.id]?.role} · ({num(sel.x, lang)}, {num(sel.y, lang)})
              </p>
              <p className={`mt-4 text-sm ${sel.ok ? "text-bone" : "text-signal"}`}>
                <span className="eyebrow mr-2">{sel.action}</span>
                {sel.msg}
              </p>
              {sel.thought && (
                <p className="mt-4 border-l-2 border-line-2 pl-3 font-serif text-lg italic text-bone/90">
                  “{sel.thought}”
                </p>
              )}
              <p className="mt-4 text-xs text-ash">
                {labels.carrying}:{" "}
                {Object.entries(sel.inv ?? {}).map(([k, v]) => `${k} ${v}`).join(", ") || labels.nothing}
              </p>
            </>
          ) : (
            <p className="text-sm text-ash">{labels.tapHint}</p>
          )}
        </div>
        <div className="rounded-3xl border border-line bg-ink-2 p-5">
          <p className="eyebrow mb-3">{labels.feed}</p>
          <ul className="space-y-2 text-sm">
            {feed.map((e, k) => (
              <li key={k} className={e.tone}>
                <span className="num mr-2 text-dim">{num(e.tick, lang)}</span>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
