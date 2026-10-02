"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { GlobeItem } from "./Globe";

// The 3D engine is a separate chunk that is only fetched when the device qualifies.
const Globe = dynamic(() => import("./Globe"), { ssr: false });

export interface HeroItem extends GlobeItem {
  title: string;
  href: string;
  typeLabel: string;
}

interface Props {
  items: HeroItem[];
  labels: { aria: string; off: string; on: string; hint: string; open: string };
}

interface NetworkInfo {
  saveData?: boolean;
  effectiveType?: string;
}

/** 3D only when WebGL works and the connection isn't flagged as data-saving or 2G. */
function canRun3D(): boolean {
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return false;
  } catch {
    return false;
  }
  const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return false;
  return true;
}

export default function HeroGlobe({ items, labels }: Props) {
  // "pending" until we've looked at the device, so the poster never flashes away and back.
  const [mode, setMode] = useState<"pending" | "on" | "off">("pending");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("bl-3d");
    } catch {}
    const next = saved === "0" ? "off" : saved === "1" ? (canRun3D() ? "on" : "off") : canRun3D() ? "on" : "off";
    // Deferred so the first paint (poster + text) is never blocked by this check.
    const id = window.setTimeout(() => setMode(next), 0);
    return () => window.clearTimeout(id);
  }, []);

  const toggle = () => {
    const next = mode === "on" ? "off" : "on";
    setMode(next);
    setSelected(null);
    try {
      localStorage.setItem("bl-3d", next === "on" ? "1" : "0");
    } catch {}
  };

  const sel = items.find((i) => i.id === selected);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] select-none">
      {/* Poster: pure CSS, zero requests. It is also the no-3D experience. */}
      <div
        aria-hidden
        className="absolute inset-[8%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 62% 42%, #ffb34755 0, transparent 14%), radial-gradient(circle at 40% 35%, #1b2d5a 0, #0a1226 55%, #060a13 100%)",
          boxShadow: "0 0 80px #3d6bff33, inset 0 0 40px #0006",
          opacity: mode === "on" ? 0 : 1,
          transition: "opacity .5s",
        }}
      />
      {mode === "on" && (
        <div role="img" aria-label={labels.aria} className="absolute inset-0">
          <Globe items={items} selectedId={selected} onSelect={setSelected} />
        </div>
      )}

      {sel && (
        <div className="absolute inset-x-3 bottom-10 z-10 flex items-center gap-3 rounded-2xl border border-line bg-panel/95 p-3 shadow-xl backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-mist">{sel.typeLabel}</p>
            <p className="font-bold">{sel.title}</p>
          </div>
          <Link
            href={sel.href}
            className="shrink-0 rounded-xl bg-ember px-4 py-2 text-sm font-bold text-ink"
          >
            {labels.open}
          </Link>
        </div>
      )}

      <div className="absolute inset-x-0 -bottom-2 flex flex-col items-center gap-1 text-center">
        {mode === "on" && !sel && <p className="text-xs text-mist">{labels.hint}</p>}
        {mode !== "pending" && (
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-line px-3 py-1 text-xs text-mist hover:bg-panel-2"
          >
            {mode === "on" ? labels.off : labels.on}
          </button>
        )}
      </div>
    </div>
  );
}
