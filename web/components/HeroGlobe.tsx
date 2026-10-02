"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { canRun3D } from "@/lib/capability";
import type { GlobeItem } from "./Globe";

// The 3D engine is a separate chunk, only fetched when the device qualifies.
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

export default function HeroGlobe({ items, labels }: Props) {
  // "pending" until the device is checked, so the poster never flashes away and back.
  const [mode, setMode] = useState<"pending" | "on" | "off">("pending");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("bl-3d");
    } catch {}
    const next = saved === "0" ? "off" : canRun3D() ? "on" : "off";
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
    <div className="relative mx-auto aspect-square w-full max-w-[640px] select-none">
      {/* Poster: pure CSS, zero requests. Also the no-3D experience. */}
      <div
        aria-hidden
        className="absolute inset-[9%] rounded-full transition-opacity duration-700"
        style={{
          background:
            "radial-gradient(circle at 63% 47%, #ff313155 0, transparent 9%), radial-gradient(circle at 38% 32%, #2a2622 0, #121110 48%, #0b0a09 72%)",
          boxShadow: "0 0 0 1px #2a2725, 0 0 120px #ff31310f, inset 0 0 60px #000",
          opacity: mode === "on" ? 0 : 1,
        }}
      />
      {mode === "on" && (
        <div role="img" aria-label={labels.aria} className="intro-fade absolute inset-0">
          <Globe items={items} selectedId={selected} onSelect={setSelected} />
        </div>
      )}

      {sel && (
        <div className="absolute inset-x-4 bottom-12 z-10 flex items-center gap-4 rounded-2xl border border-line-2 bg-ink-2/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-md">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">{sel.typeLabel}</p>
            <p className="mt-0.5 text-lg font-medium">{sel.title}</p>
          </div>
          <Link
            href={sel.href}
            className="shrink-0 rounded-full bg-bone px-5 py-2 text-sm font-semibold text-ink transition hover:bg-white"
          >
            {labels.open} →
          </Link>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 text-xs text-dim">
        {mode === "on" && !sel && <span>{labels.hint}</span>}
        {mode !== "pending" && (
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-line px-3 py-1 text-ash transition hover:border-line-2 hover:text-bone"
          >
            {mode === "on" ? labels.off : labels.on}
          </button>
        )}
      </div>
    </div>
  );
}
