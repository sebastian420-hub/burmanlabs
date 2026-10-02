import type { ItemType } from "@/content/catalog";

/**
 * Generative cover art for a catalog item: deterministic from its id, pure SVG, zero
 * requests. Textbooks get lines of "text", apps a grid of tiles, simulations orbits.
 * Swap in a real image later by giving the item a cover.
 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BONE = "#f2efe9";
const RED = "#ff3131";

export default function Cover({ id, type, className = "" }: { id: string; type: ItemType; className?: string }) {
  const r = rng(id);
  const W = 400;
  const H = 260;
  let art: React.ReactNode;

  if (type === "textbook") {
    const lines = 9;
    const mark = Math.floor(r() * lines);
    art = (
      <g>
        {Array.from({ length: lines }, (_, i) => {
          const y = 52 + i * 19;
          const w = 120 + r() * 200;
          return (
            <rect
              key={i}
              x={48}
              y={y}
              width={i === mark ? w * 0.6 : w}
              height={i === 0 ? 7 : 3}
              rx={1.5}
              fill={i === mark ? RED : BONE}
              opacity={i === 0 ? 0.9 : i === mark ? 1 : 0.28}
            />
          );
        })}
        <rect x={W - 70} y={0} width={14} height={60 + r() * 40} fill={RED} />
      </g>
    );
  } else if (type === "app") {
    const cols = 6;
    const rows = 4;
    const hot = Math.floor(r() * cols * rows);
    art = (
      <g>
        {Array.from({ length: cols * rows }, (_, i) => {
          const c = i % cols;
          const row = Math.floor(i / cols);
          const s = 30;
          return (
            <rect
              key={i}
              x={70 + c * 45}
              y={45 + row * 45}
              width={s}
              height={s}
              rx={9}
              fill={i === hot ? RED : "none"}
              stroke={i === hot ? RED : BONE}
              strokeOpacity={0.3 + r() * 0.3}
            />
          );
        })}
      </g>
    );
  } else {
    const cx = 200 + (r() - 0.5) * 60;
    const cy = 130;
    const rings = 5;
    const which = 1 + Math.floor(r() * (rings - 1));
    const tilt = -20 + r() * 40;
    art = (
      <g transform={`rotate(${tilt} ${cx} ${cy})`}>
        {Array.from({ length: rings }, (_, i) => {
          const rx = 34 + i * 34;
          const ry = rx * (0.42 + r() * 0.12);
          return (
            <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={BONE} strokeOpacity={0.14 + i * 0.05} />
          );
        })}
        <circle cx={cx} cy={cy} r={9} fill={BONE} />
        <circle cx={cx + 34 + which * 34} cy={cy} r={6} fill={RED} />
      </g>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
      role="presentation"
    >
      <rect width={W} height={H} fill="#131211" />
      {art}
    </svg>
  );
}
