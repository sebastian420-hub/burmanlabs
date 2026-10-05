"use client";

/**
 * The Village replay. Before the tap it is already a picture: the episode's
 * last afternoon, its key moments and its people, from a few KB the page
 * carries (lib/village.ts getDigest). Pressing play downloads the ~0.3 MB
 * trace and the same view comes alive: the camera visits each key moment,
 * slows down and says what happened, and tapping a villager follows them.
 *
 * Drawing lives in ./iso.ts; this file is playback, camera and the panels.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { num } from "@/lib/i18n";
import { artLoop, deviceProfile } from "@/lib/artLoop";
import { parseTrace, parseAmount, type Digest, type Moment, type Trace, type Tick } from "@/lib/villageTrace";
import { draw, fitZoom, project, ROLE, type Camera, type Scene, type SceneAgent, type SceneLink } from "./iso";

type V = Dict["village"];

const RATE: Record<number, number> = { 1: 2, 4: 8, 16: 32 }; // ticks per second
const HOLD = 2.8; // seconds the replay rests on a key moment
const KIND_TONE: Record<string, string> = {
  death: "bg-signal", birth: "bg-gold", build: "bg-gold", library: "bg-[#b99ad6]",
  trade: "bg-bone", teach: "bg-bone", collapse: "bg-ash",
};

async function loadTrace(url: string): Promise<Trace> {
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
  return parseTrace(text);
}

/** The engine's own words carry map coordinates; a reader needs none. */
const plain = (t: string) => t.replace(/\s*(?:at|to)? \(\d+, \d+\)/g, "").replace(/\s*\[[^\]]*\]\s*$/, "");

const fill = (tpl: string, vars: Record<string, string>) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

export default function VillageReplay({ url, lang, v, digest }: { url: string; lang: Locale; v: V; digest: Digest }) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [i, setI] = useState(0); // tick index shown in the panels
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null); // tick of the moment on screen

  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const after = useRef<((t: Trace) => void) | null>(null);
  // Playback lives in refs so the render loop never waits on React.
  const st = useRef({
    pos: 0, hold: 0, playing: false, speed: 4, selected: null as string | null, active: null as number | null,
    cam: null as Camera | null, manual: null as Camera | null, w: 1, h: 1, dpr: 1, last: 0, clock: 0,
  });
  useEffect(() => {
    st.current.playing = playing;
    st.current.speed = speed;
    st.current.selected = selected;
  }, [playing, speed, selected]);

  const { cast, size } = digest;
  const name = useCallback((id: string) => cast[id]?.name ?? "?", [cast]);
  const first = digest.firstTick;
  const span = Math.max(1, digest.lastTick - first);
  const moments = digest.moments;

  const momentText = useCallback(
    (m: Moment) => {
      const a = name(m.who[0]), b = m.who[1] ? name(m.who[1]) : "";
      const thing = v.buildings[m.detail ?? ""] ?? m.detail ?? "";
      const key = m.kind === "death" ? (m.detail as keyof V["moment"]) ?? "other"
        : m.kind === "build" && !m.who.length ? "buildAnon" : m.kind;
      return fill(v.moment[key as keyof V["moment"]] ?? v.moment.other, { a, b, thing });
    },
    [name, v],
  );
  const when = useCallback(
    (day: number, time: string) => `${v.day} ${num(day, lang)} · ${v.times[time as keyof V["times"]] ?? time}`,
    [v, lang],
  );

  const start = useCallback(
    (then?: (t: Trace) => void) => {
      if (trace) { then?.(trace); return; }
      after.current = then ?? ((t) => { st.current.pos = 0; setI(0); void t; setPlaying(true); });
      if (status === "loading") return;
      setStatus("loading");
      loadTrace(url)
        .then((t) => { setTrace(t); setStatus("ready"); })
        .catch(() => setStatus("error"));
    },
    [trace, status, url],
  );
  useEffect(() => {
    if (trace && after.current) { const f = after.current; after.current = null; f(trace); }
  }, [trace]);

  const jumpTo = useCallback((tick: number) => {
    const s = st.current;
    s.pos = Math.max(0, tick - first - 3);
    s.hold = 0; s.manual = null; s.active = null;
    setActive(null); setI(Math.floor(s.pos)); setPlaying(true);
    // On a phone the list sits below the map: bring the map back into view.
    const r = hostRef.current?.getBoundingClientRect();
    if (r && (r.top < 0 || r.bottom > window.innerHeight)) hostRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [first]);

  const ticks = trace?.ticks;
  const byName = useMemo(() => Object.fromEntries(Object.entries(cast).map(([id, c]) => [c.name, id])), [cast]);

  /** What is on the map at a (fractional) position in the replay. */
  const sceneAt = useCallback(
    (pos: number): Omit<Scene, "clock"> => {
      const s = st.current;
      const spotM = s.active != null ? moments.find((m) => m.tick === s.active) : undefined;
      const at = ticks ? ticks[Math.min(ticks.length - 1, Math.floor(pos))].tick : digest.poster.tick;
      const graves = moments.filter((m) => m.kind === "death" && m.tick <= at).map((m) => ({ x: m.x, y: m.y }));
      const base = { size, terrain: digest.terrain, cast, graves, selected: s.selected, spot: spotM ? { x: spotM.x, y: spotM.y } : null,
        highlight: spotM ? moments.filter((m) => m.tick === s.active).flatMap((m) => m.who) : [] };
      if (!ticks) {
        const p = digest.poster;
        return { ...base, agents: p.agents.filter((a) => a.alive), objects: p.objects, resources: p.resources, time: p.time, links: [] };
      }
      const k = Math.min(ticks.length - 1, Math.floor(pos)), f = pos - k;
      const A = ticks[k], B = ticks[Math.min(ticks.length - 1, k + 1)];
      const next = Object.fromEntries(B.agents.map((a) => [a.id, a]));
      const agents: SceneAgent[] = [];
      const links: SceneLink[] = [];
      for (const a of A.agents) {
        if (!a.alive || a.action === "death") continue;
        const b = next[a.id];
        const x = b && b.alive ? a.x + (b.x - a.x) * f : a.x, y = b && b.alive ? a.y + (b.y - a.y) * f : a.y;
        agents.push({ id: a.id, x, y, collapsed: a.collapsed, talking: a.social?.type === "conversation" });
        const other = a.social?.with ? byName[a.social.with] : undefined;
        if (other && a.social?.type === "trade_success") links.push({ from: a.id, to: other, kind: "trade" });
        if (other && a.social?.type === "teach_success") links.push({ from: a.id, to: other, kind: "teach" });
      }
      return { ...base, agents, objects: A.objects, resources: A.resources, time: A.time_of_day, links };
    },
    [ticks, digest, size, cast, moments, byName],
  );

  // The render loop: advance playback, steer the camera, draw.
  useEffect(() => {
    const host = hostRef.current, canvas = canvasRef.current;
    if (!host || !canvas) return;
    const g = canvas.getContext("2d")!;
    const s = st.current;
    s.last = performance.now();
    // artLoop draws once while it is being set up, so read this before it exists.
    const { reduced } = deviceProfile();
    const loop = artLoop(host, {
      onResize: (w, h, dpr) => {
        s.w = w; s.h = h; s.dpr = dpr;
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      },
      frame: () => {
        const now = performance.now();
        const dt = Math.min(0.1, (now - s.last) / 1000);
        s.last = now; s.clock += dt;
        const n = ticks?.length ?? 1;

        if (ticks && s.playing) {
          if (s.hold > 0) s.hold -= dt;
          else {
            const nextM = moments.find((m) => m.tick - first > s.pos + 1e-6);
            let rate = RATE[s.speed] ?? 8;
            if (nextM && nextM.tick - first - s.pos < 4) rate = Math.min(rate, 3);
            let p = s.pos + rate * dt;
            if (nextM && p >= nextM.tick - first) {
              p = nextM.tick - first; s.hold = HOLD; s.active = nextM.tick; setActive(nextM.tick);
            }
            if (p >= n - 1) { p = n - 1; setPlaying(false); }
            if (s.active != null && p - (s.active - first) > 8) { s.active = null; setActive(null); }
            if (Math.floor(p) !== Math.floor(s.pos)) setI(Math.floor(p));
            s.pos = p;
          }
        }

        const scene = sceneAt(s.pos);
        const fit = fitZoom(size, s.w, s.h);
        const centre = { x: size / 2, y: size / 2, zoom: fit };
        let target: Camera = centre;
        const me = s.selected ? scene.agents.find((a) => a.id === s.selected) : undefined;
        const spot = scene.spot;
        // A key moment takes the camera, even from the villager being followed.
        if (s.manual) target = s.manual;
        else if (spot && ticks) target = { x: spot.x + 0.5, y: spot.y + 0.5, zoom: Math.max(fit * 2.2, 30) };
        else if (me) target = { x: me.x + 0.5, y: me.y + 0.5, zoom: Math.max(fit * 2.6, 36) };
        else target = { ...centre, zoom: fit * (s.h / s.w > 0.85 ? 1.9 : 1.3) };
        const cam = s.cam ?? { ...target };
        const k = reduced ? 1 : Math.min(1, dt * 3);
        cam.x += (target.x - cam.x) * k; cam.y += (target.y - cam.y) * k; cam.zoom += (target.zoom - cam.zoom) * k;
        s.cam = cam;

        g.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
        draw(g, s.w, s.h, cam, { ...scene, clock: s.clock });
      },
    });
    // With reduced motion the loop only draws on demand: step playback on a timer instead.
    const id = reduced ? window.setInterval(() => loop.redraw(), 120) : 0;
    return () => { loop.stop(); window.clearInterval(id); };
  }, [ticks, moments, first, size, sceneAt]);

  // Map interaction: tap a villager to follow, drag to look around.
  const drag = useRef<{ x: number; y: number; moved: boolean; cam: Camera } | null>(null);
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cam = st.current.cam;
    if (cam) drag.current = { x: e.clientX, y: e.clientY, moved: false, cam: { ...cam } };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    const tw = d.cam.zoom, th = tw / 2;
    st.current.manual = { zoom: st.current.manual?.zoom ?? d.cam.zoom, x: d.cam.x - (dx / tw + dy / th), y: d.cam.y - (dy / th - dx / tw) };
    setSelected(null);
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const s = st.current, cam = s.cam;
    if (!cam) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left, py = e.clientY - r.top;
    let best: string | null = null, bestD = 26;
    for (const a of sceneAt(s.pos).agents) {
      const p = project(cam, s.w, s.h, a.x + 0.5, a.y + 0.5);
      const dd = Math.hypot(p.sx - px, p.sy - Math.max(cam.zoom * 0.3, 4) - py);
      if (dd < bestD) { bestD = dd; best = a.id; }
    }
    if (best) { s.manual = null; setSelected(best); }
    else if (!trace) start();
  };
  const zoomBy = (f: number) => {
    const s = st.current, cam = s.cam;
    if (!cam) return;
    const fit = fitZoom(size, s.w, s.h);
    const base = s.manual ?? cam;
    s.manual = { x: base.x, y: base.y, zoom: Math.min(fit * 6, Math.max(fit, base.zoom * f)) };
  };
  const wholeVillage = () => { st.current.manual = null; setSelected(null); };

  const tick: Tick | undefined = ticks?.[i];
  const clockDay = tick?.day ?? Math.floor((digest.poster.tick - 1) / 24) + 1;
  const clockTime = tick?.time_of_day ?? digest.poster.time;
  const nowTick = tick?.tick ?? digest.poster.tick;
  const sel = selected && tick ? tick.agents.find((a) => a.id === selected) : undefined;
  const activeMoments = active != null ? moments.filter((m) => m.tick === active) : [];
  const passed = moments.filter((m) => m.tick <= nowTick && trace);

  const items = (inv: Record<string, number> | undefined) =>
    Object.entries(inv ?? {}).filter(([, n]) => n > 0)
      .map(([k, n]) => `${num(n, lang)} ${(n === 1 ? v.itemOne[k] : v.items[k]) ?? k}`).join(" · ") || v.nothing;
  const amount = (s: string | undefined) => {
    const a = parseAmount(s);
    return a ? `${num(a.n, lang)} ${(a.n === 1 ? v.itemOne[a.item] : v.items[a.item]) ?? a.item}` : s ?? "";
  };

  const feed = useMemo(() => {
    if (!ticks) return [];
    const out: { tick: number; text: string }[] = [];
    for (let k = Math.max(0, i - 30); k <= i; k++) {
      for (const a of ticks[k].agents) {
        const s = a.social;
        if (s?.type === "trade_success" && s.with)
          out.push({ tick: ticks[k].tick, text: fill(v.feedTrade, { a: name(a.id), b: s.with, gave: amount(s.gave), received: amount(s.received) }) });
        else if (s?.type === "teach_success" && s.with)
          out.push({ tick: ticks[k].tick, text: fill(v.feedTeach, { a: name(a.id), b: s.with }) });
      }
    }
    return out.slice(-5).reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, ticks, v, name, lang]);

  const pill = "rounded-full border px-3 py-1.5 text-xs transition";

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-8">
        <div ref={hostRef} className="relative aspect-square overflow-hidden rounded-3xl border border-line bg-ink sm:aspect-[16/11]">
          <canvas
            ref={canvasRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => (drag.current = null)}
            className="absolute inset-0 size-full cursor-pointer"
            style={{ touchAction: "pan-y" }}
            aria-label={v.title}
          />

          <p className="num pointer-events-none absolute top-3 left-3 rounded-full bg-ink/75 px-3 py-1 text-xs text-bone backdrop-blur">
            {when(clockDay, clockTime)}
          </p>
          <div className="absolute top-3 right-3 flex gap-1.5">
            <MapButton label={v.zoomIn} onClick={() => zoomBy(1.5)}>+</MapButton>
            <MapButton label={v.zoomOut} onClick={() => zoomBy(1 / 1.5)}>−</MapButton>
            <MapButton label={v.whole} onClick={wholeVillage}>⤢</MapButton>
          </div>

          {sel && activeMoments.length === 0 && (
            <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-bone px-3 py-1 text-sm text-ink lg:hidden">
              {name(sel.id)} · {v.doing[sel.action] ?? sel.action}
            </p>
          )}
          {activeMoments.length > 0 && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-2xl bg-ink/85 px-4 py-3 backdrop-blur sm:right-auto sm:max-w-md sm:p-4">
              <p className="eyebrow num text-gold">{when(activeMoments[0].day, activeMoments[0].time)}</p>
              {activeMoments.map((m, k) => (
                <p key={k} className="mt-1 font-serif text-lg leading-snug text-bone sm:text-2xl">{momentText(m)}</p>
              ))}
            </div>
          )}

          {!trace && (
            <div className="absolute inset-0 grid place-items-center bg-ink/35">
              <div className="text-center">
                {status === "error" ? (
                  <p className="rounded-full bg-ink/80 px-4 py-2 text-signal">{v.failed}</p>
                ) : (
                  <>
                    <button type="button" onClick={() => start()} disabled={status === "loading"}
                      className="inline-flex items-center gap-3 rounded-full bg-bone py-3 pr-7 pl-3 text-lg font-medium text-ink shadow-lg transition hover:bg-white">
                      <span className="grid size-9 place-items-center rounded-full bg-signal text-sm text-ink">▶</span>
                      {status === "loading" ? v.loading : v.start}
                    </button>
                    <p className="mt-3 rounded-full bg-ink/70 px-3 py-1 text-xs text-ash">{v.startNote}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls and the timeline, with the key moments marked on it. */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => (trace ? setPlaying((p) => !p) : start())}
            className="rounded-full bg-bone px-5 py-2 text-sm font-medium text-ink transition hover:bg-white">
            {playing ? `❚❚ ${v.pause}` : `▶ ${v.play}`}
          </button>
          <button type="button"
            onClick={() => {
              const m = moments.find((x) => x.tick - first > st.current.pos + 1);
              if (m) start(() => jumpTo(m.tick));
            }}
            className={`${pill} border-line-2 text-bone hover:border-bone`}>
            {v.nextMoment} ⏭
          </button>
          <button type="button" onClick={() => setSpeed((x) => (x === 1 ? 4 : x === 4 ? 16 : 1))}
            aria-label={`${v.speed} ×${speed}`} className={`${pill} num border-line-2 text-bone hover:border-bone`}>
            ×{num(speed, lang)}
          </button>
        </div>
        <div className="relative mt-3">
          <div className="relative h-4">
            {moments.map((m, k) => (
              <button key={k} type="button" title={momentText(m)} aria-label={momentText(m)}
                onClick={() => start(() => jumpTo(m.tick))}
                className={`absolute top-0.5 size-3 -translate-x-1/2 rounded-full ring-2 ring-ink transition hover:scale-150 ${KIND_TONE[m.kind]}`}
                style={{ left: `${((m.tick - first) / span) * 100}%` }} />
            ))}
          </div>
          <input type="range" min={0} max={(ticks?.length ?? 1) - 1} value={trace ? i : 0} disabled={!trace}
            onChange={(e) => { const s = st.current; s.pos = Number(e.target.value); s.hold = 0; s.active = null; setActive(null); setI(s.pos); }}
            className="w-full accent-[#ff3131]" aria-label={v.tick} />
        </div>

        {/* The cast: tap a name to follow that villager. */}
        <div className="mt-4">
          <p className="eyebrow mb-2">{v.follow}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {digest.people.map(({ id, died, born }) => {
              const gone = died != null && nowTick >= died && !!trace;
              const unborn = born != null && nowTick < born && !!trace;
              const on = selected === id;
              return (
                <button key={id} type="button" disabled={gone || unborn}
                  onClick={() => { st.current.manual = null; setSelected(on ? null : id); if (!trace) start(() => {}); }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-2 text-sm transition ${
                    on ? "border-bone bg-bone text-ink" : "border-line-2 text-bone hover:border-bone"} ${gone || unborn ? "opacity-35" : ""}`}>
                  <span className="size-3 rounded-full" style={{ background: ROLE[cast[id]?.role] }} />
                  {cast[id]?.name}
                  {gone && <span className="text-xs">†</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4">
        <div className="rounded-3xl border border-line bg-ink-2 p-5">
          {sel ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="display text-3xl">{name(sel.id)}</p>
                  <p className="mt-1 text-sm text-ash">{v.roles[cast[sel.id]?.role as keyof V["roles"]] ?? cast[sel.id]?.role}</p>
                </div>
                <button type="button" onClick={wholeVillage} className={`${pill} border-line-2 text-ash hover:text-bone`}>{v.stop}</button>
              </div>
              <p className="eyebrow mt-5">{v.now}</p>
              <p className={`mt-1 text-lg ${sel.ok ? "text-bone" : "text-signal"}`}>{v.doing[sel.action] ?? sel.action}</p>
              <p className="mt-1 text-sm text-ash" lang="en">{plain(sel.msg)}</p>
              {sel.thought && (
                <p className="mt-4 border-l-2 border-gold/60 pl-3 font-serif text-lg italic leading-snug text-bone/90" lang="en">
                  “{plain(sel.thought)}”
                </p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-ash">
                {([[v.energy, sel.energy, "#c9a45c"], [v.water, sel.water, "#7fb4d8"]] as const).map(([label, val, c]) => (
                  <div key={label}>
                    <p>{label}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, val ?? 0))}%`, background: c }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ash">{v.carrying}: <span className="text-bone">{items(sel.inv)}</span></p>
            </>
          ) : selected && !trace ? (
            <>
              <p className="display text-3xl">{name(selected)}</p>
              <p className="mt-2 text-sm text-ash">{status === "loading" ? v.loading : v.startNote}</p>
            </>
          ) : (
            <p className="text-ash">{v.followHint}</p>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-ink-2 p-5">
          <p className="eyebrow mb-3">{v.chapters}</p>
          <ol className="space-y-1">
            {moments.map((m, k) => {
              const here = active === m.tick, done = passed.includes(m);
              return (
                <li key={k}>
                  <button type="button" onClick={() => start(() => jumpTo(m.tick))}
                    className={`flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-ink-3 ${here ? "bg-ink-3" : ""}`}>
                    <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${KIND_TONE[m.kind]}`} />
                    <span>
                      <span className="num block text-xs text-dim">{when(m.day, m.time)}</span>
                      <span className={`block text-sm ${here || done ? "text-bone" : "text-ash"}`}>{momentText(m)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {feed.length > 0 && (
          <div className="hidden rounded-3xl border border-line bg-ink-2 p-5 lg:block">
            <p className="eyebrow mb-3">{v.feed}</p>
            <ul className="space-y-2 text-sm text-ash">
              {feed.map((e, k) => <li key={k}>{e.text}</li>)}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="grid size-8 place-items-center rounded-full bg-ink/75 text-sm text-bone backdrop-blur transition hover:bg-ink">
      {children}
    </button>
  );
}
