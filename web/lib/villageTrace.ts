/**
 * The Village trace: types, parsing and the "moments" worth showing. Pure (no
 * fs, no DOM), so the server uses it at build time for the poster and the
 * chapter list, and the replay uses it in the browser after the tap.
 */

export type TraceAgent = {
  id: string; x: number; y: number; alive: boolean; collapsed?: boolean;
  action: string; ok: boolean; msg: string; thought: string;
  inv?: Record<string, number>; energy?: number; water?: number;
  social?: { type?: string; with?: string; gave?: string; received?: string } | null;
};
export type TraceObject = { id: string; type: string; x: number; y: number };
export type Tick = {
  tick: number; day: number; hour: number; time_of_day: string;
  agents: TraceAgent[];
  resources: [number, number, string, number][];
  objects: TraceObject[];
  deaths: { id: string; name: string; cause: string }[];
  births?: { id: string; name: string; role: string; house_owner: string }[];
};
export type TraceHeader = {
  size: number; terrain: string[];
  agents: { id: string; name: string; role: string; alive?: boolean }[];
};
export type Trace = { header: TraceHeader; ticks: Tick[] };

export type Cast = Record<string, { name: string; role: string }>;

export type MomentKind = "death" | "birth" | "build" | "trade" | "teach" | "library" | "collapse";
export interface Moment {
  tick: number;
  day: number;
  time: string; // time_of_day
  kind: MomentKind;
  /** Ids of the people involved; the first is the subject. */
  who: string[];
  x: number;
  y: number;
  /** Building type, cause of death, ... */
  detail?: string;
}

/** A still frame: what the poster draws before anything is downloaded. */
export interface Frame {
  tick: number;
  time: string;
  agents: { id: string; x: number; y: number; alive: boolean }[];
  objects: TraceObject[];
  resources: [number, number, string, number][];
}

export interface Digest {
  size: number;
  terrain: string[];
  cast: Cast;
  /** People in order of first appearance, with the tick they died (if they did). */
  people: { id: string; died?: number; born?: number }[];
  firstTick: number;
  lastTick: number;
  moments: Moment[];
  poster: Frame;
}

export function parseTrace(text: string): Trace {
  const lines = text.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const header = lines.find((l) => l.kind === "header") as TraceHeader | undefined;
  const ticks = lines.filter((l) => l.kind === "tick") as Tick[];
  if (!header || !ticks.length) throw new Error("not a trace");
  return { header, ticks };
}

export function castOf({ header, ticks }: Trace): Cast {
  const cast: Cast = {};
  for (const a of header.agents) cast[a.id] = { name: a.name, role: a.role };
  for (const t of ticks) for (const b of t.births ?? []) cast[b.id] = { name: b.name, role: b.role };
  return cast;
}

const DEATH_CAUSE: Record<string, string> = { "starved to death": "starved", "died of thirst": "thirst" };

/**
 * Everything a visitor should not miss: every death, birth and building,
 * the first trade and the first lesson, and each person's first library
 * entry and first collapse. Routine life (walking, gathering, chatting) is left to
 * the map.
 */
export function findMoments(trace: Trace): Moment[] {
  const { ticks } = trace;
  const cast = castOf(trace);
  const byName: Record<string, string> = {};
  for (const [id, c] of Object.entries(cast)) byName[c.name] = id;

  const out: Moment[] = [];
  const collapsed = new Set<string>(), wrote = new Set<string>();
  let traded = false, taught = false;
  let prev: Tick | undefined;
  for (const t of ticks) {
    const at = (m: Omit<Moment, "tick" | "day" | "time">) => out.push({ tick: t.tick, day: t.day, time: t.time_of_day, ...m });
    const known = new Set(prev?.objects.map((o) => o.id) ?? t.objects.map((o) => o.id));
    const builders = t.agents.filter((a) => a.action === "build" && a.ok).map((a) => a.id);
    for (const o of t.objects) {
      if (prev && !known.has(o.id)) at({ kind: "build", who: builders.slice(0, 1), x: o.x, y: o.y, detail: o.type });
    }
    for (const d of t.deaths) {
      const last = prev?.agents.find((a) => a.id === d.id) ?? t.agents.find((a) => a.id === d.id);
      at({ kind: "death", who: [d.id], x: last?.x ?? 0, y: last?.y ?? 0, detail: DEATH_CAUSE[d.cause] ?? "other" });
    }
    for (const b of t.births ?? []) {
      const me = t.agents.find((a) => a.id === b.id);
      at({ kind: "birth", who: [b.id, byName[b.house_owner]].filter(Boolean), x: me?.x ?? 0, y: me?.y ?? 0 });
    }
    for (const a of t.agents) {
      const other = a.social?.with ? byName[a.social.with] : undefined;
      if (!traded && a.social?.type === "trade_success" && other) {
        traded = true;
        at({ kind: "trade", who: [a.id, other], x: a.x, y: a.y });
      } else if (!taught && a.social?.type === "teach_success" && other) {
        taught = true;
        at({ kind: "teach", who: [a.id, other], x: a.x, y: a.y });
      } else if (a.action === "give" && a.ok && /into the library/.test(a.msg) && !wrote.has(a.id)) {
        wrote.add(a.id);
        at({ kind: "library", who: [a.id], x: a.x, y: a.y });
      } else if (a.action === "collapse" && !collapsed.has(a.id)) {
        collapsed.add(a.id);
        at({ kind: "collapse", who: [a.id], x: a.x, y: a.y });
      }
    }
    prev = t;
  }
  return out;
}

export function frameOf(t: Tick): Frame {
  return {
    tick: t.tick,
    time: t.time_of_day,
    agents: t.agents.filter((a) => a.action !== "death").map(({ id, x, y, alive }) => ({ id, x, y, alive })),
    objects: t.objects,
    resources: t.resources,
  };
}

export function digestOf(trace: Trace): Digest {
  const { header, ticks } = trace;
  const cast = castOf(trace);
  const moments = findMoments(trace);
  const people = Object.keys(cast).map((id) => ({
    id,
    died: moments.find((m) => m.kind === "death" && m.who[0] === id)?.tick,
    born: moments.find((m) => m.kind === "birth" && m.who[0] === id)?.tick,
  }));
  // The poster is the episode's last afternoon: daylight, and the village as it ended.
  let k = ticks.length - 1;
  while (k > 0 && ticks[k].time_of_day !== "afternoon") k--;
  return {
    size: header.size,
    terrain: header.terrain,
    cast,
    people,
    firstTick: ticks[0].tick,
    lastTick: ticks[ticks.length - 1].tick,
    moments,
    poster: frameOf(ticks[k] ?? ticks[ticks.length - 1]),
  };
}

/** "3 materials" -> { n: 3, item: "materials" } (the engine's own wording). */
export function parseAmount(s: string | undefined): { n: number; item: string } | null {
  const m = /^(\d+)\s+(\w+)/.exec(s ?? "");
  return m ? { n: Number(m[1]), item: m[2] } : null;
}
