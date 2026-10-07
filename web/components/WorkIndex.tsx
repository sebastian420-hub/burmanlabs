"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { canRun3D } from "@/lib/capability";
import { fold, num } from "@/lib/i18n";
import type { PreviewTarget } from "./HoverPreview";

const HoverPreview = dynamic(() => import("./HoverPreview"), { ssr: false });

export interface IndexItem {
  id: string;
  code: string;
  title: string;
  titleAlt: string;
  summary: string;
  kind: string;
  kindLabel: string;
  category: string;
  categoryLabel: string;
  stack: string;
  status: "live" | "ongoing" | "learning";
  statusLabel: string;
  year: string;
  href: string;
  /** Real screenshot, full and thumbnail. */
  shot?: { full: string; thumb: string };
  /** Generative cover when there is no screenshot. */
  cover: React.ReactNode;
  soon: boolean;
}

export interface IndexLabels {
  code: string;
  name: string;
  kind: string;
  stack: string;
  status: string;
  year: string;
  view: string;
  list: string;
  grid: string;
  count: string; // {n}
  hint: string;
  search?: string;
  searchLabel?: string;
  all?: string;
  kinds?: string;
  categories?: string;
  empty?: string;
  zawgyi?: string;
}

interface Props {
  items: IndexItem[];
  labels: IndexLabels;
  digits: "my" | "en";
  /** Show search and kind/topic filters (the All-work page). */
  filters?: { kinds: { id: string; label: string }[]; categories: { id: string; label: string }[] };
  initial?: { q?: string; kind?: string; cat?: string };
  defaultView?: "list" | "grid";
}

const STATUS_DOT: Record<IndexItem["status"], string> = {
  live: "bg-gold",
  ongoing: "bg-signal",
  learning: "bg-ash",
};

export default function WorkIndex({ items, labels, digits, filters, initial, defaultView = "list" }: Props) {
  const [view, setView] = useState<"list" | "grid">(defaultView);
  const [q, setQ] = useState(initial?.q ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "all");
  const [cat, setCat] = useState(initial?.cat ?? "all");
  const [hover, setHover] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [fancy, setFancy] = useState(false);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Remembered view; hover preview only where a pointer and WebGL both exist.
  useEffect(() => {
    // Deferred so the server HTML and the first client paint match.
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem("bl-view");
        if (saved === "list" || saved === "grid") setView(saved);
      } catch {}
      const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setFancy(fine && !reduced && canRun3D());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const pick = (v: "list" | "grid") => {
    setView(v);
    try {
      localStorage.setItem("bl-view", v);
    } catch {}
  };

  const haystacks = useMemo(
    () => items.map((i) => fold(`${i.code} ${i.title} ${i.titleAlt} ${i.summary} ${i.stack} ${i.kindLabel} ${i.categoryLabel}`)),
    [items],
  );
  const needle = fold(q.trim());
  const shown = items.filter(
    (it, idx) =>
      (kind === "all" || it.kind === kind) &&
      (cat === "all" || it.category === cat) &&
      (!needle || haystacks[idx].includes(needle)),
  );

  const enter = (it: IndexItem, anchor?: { x: number; y: number }) => {
    setHover(it.id);
    // Rows without a screenshot clear the preview rather than leaving the last one up.
    setPreview(fancy && it.shot ? { src: it.shot.full, anchor } : null);
  };
  const leave = () => {
    setHover(null);
    setPreview(null);
  };
  const focusRow = (it: IndexItem) => {
    const el = rowRefs.current.get(it.id);
    if (!el) return enter(it);
    const r = el.getBoundingClientRect();
    enter(it, { x: Math.min(innerWidth - 190, r.right - 200), y: r.top + r.height / 2 });
  };

  return (
    <div>
      {/* Toolbar: filters (optional), count, view toggle */}
      <div className="flex flex-col gap-3 border-b border-line pb-3 md:flex-row md:items-end md:justify-between">
        {filters ? (
          <div className="flex flex-1 flex-col gap-3">
            <label className="relative block max-w-md">
              <span className="sr-only">{labels.searchLabel}</span>
              <input
                type="search"
                inputMode="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={labels.search}
                className="mono-lg w-full border-0 border-b border-line-2 bg-transparent py-2 text-base outline-none placeholder:text-dim focus:border-bone"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
              <Chips label={labels.kinds ?? ""} value={kind} onChange={setKind} all={labels.all ?? "All"} options={filters.kinds} />
              <span className="hidden h-4 w-px bg-line sm:block" />
              <Chips label={labels.categories ?? ""} value={cat} onChange={setCat} all={labels.all ?? "All"} options={filters.categories} />
            </div>
          </div>
        ) : (
          <p className="mono text-dim" aria-live="polite">
            {labels.count.replace("{n}", num(shown.length, digits))}
            {fancy && <span className="ml-3 hidden text-dim/70 lg:inline">· {labels.hint}</span>}
          </p>
        )}
        <div className="flex items-center gap-3">
          {filters && (
            <p className="mono text-dim" role="status">
              {labels.count.replace("{n}", num(shown.length, digits))}
            </p>
          )}
          <div role="group" aria-label={labels.view} className="mono flex overflow-hidden rounded-full border border-line">
            {(["list", "grid"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => pick(v)}
                className={`px-3 py-1.5 transition ${view === v ? "bg-bone text-ink" : "text-ash hover:text-bone"}`}
              >
                {v === "list" ? labels.list : labels.grid}
              </button>
            ))}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-8 border border-dashed border-line-2 p-10 text-center text-ash">
          <p>{labels.empty}</p>
          <p className="mono mt-2 text-dim">{labels.zawgyi}</p>
        </div>
      ) : view === "list" ? (
        <div className="index" data-hover={hover ? "1" : "0"} data-preview={preview?.src ?? ""} onMouseLeave={leave}>
          {/* Column heads (desktop) */}
          <div className="mono hidden grid-cols-[4.5rem_1fr_7rem_1fr_7.5rem_3.5rem_2.5rem] gap-x-4 border-b border-line py-2 text-dim md:grid">
            <span>{labels.code}</span>
            <span>{labels.name}</span>
            <span>{labels.kind}</span>
            <span>{labels.stack}</span>
            <span>{labels.status}</span>
            <span>{labels.year}</span>
            <span />
          </div>
          <ul>
            {shown.map((it) => (
              <li key={it.id} className="row border-b border-line" data-on={hover === it.id ? "1" : "0"}>
                <Link
                  href={it.href}
                  ref={(el) => {
                    if (el) rowRefs.current.set(it.id, el);
                  }}
                  onMouseEnter={() => enter(it)}
                  onFocus={() => focusRow(it)}
                  onBlur={leave}
                  className="group grid min-h-[72px] grid-cols-[4.5rem_1fr_2.5rem] items-center gap-x-3 py-3 md:min-h-[64px] md:grid-cols-[4.5rem_1fr_7rem_1fr_7.5rem_3.5rem_2.5rem] md:gap-x-4 md:py-0"
                >
                  <span className="mono text-dim">{it.code}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[1.05rem] font-medium text-bone transition-colors group-hover:text-signal md:text-lg">
                      {it.title}
                    </span>
                    {/* Phone: the facts on a second line */}
                    <span className="mono mt-1 flex flex-wrap items-center gap-x-2 text-dim md:hidden">
                      <span>{it.kindLabel}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${STATUS_DOT[it.status]}`} />
                        {it.statusLabel}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{it.year}</span>
                    </span>
                  </span>
                  <span className="mono hidden text-ash md:block">{it.kindLabel}</span>
                  <span className="mono hidden truncate text-ash md:block" lang="en">
                    {it.stack || "—"}
                  </span>
                  <span className="mono hidden items-center gap-2 text-ash md:flex">
                    <span className={`size-1.5 rounded-full ${STATUS_DOT[it.status]}`} />
                    {it.statusLabel}
                  </span>
                  <span className="mono hidden text-ash md:block">{it.year}</span>
                  <span
                    aria-hidden
                    className="grid size-8 place-items-center justify-self-end rounded-full border border-line text-ash transition duration-300 group-hover:border-signal group-hover:bg-signal group-hover:text-ink"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {fancy && <HoverPreview target={preview} />}
        </div>
      ) : (
        <ul className="mt-6 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden border border-line bg-ink-2 transition duration-500 group-hover:border-line-2">
                  {it.shot ? (
                    <Image
                      src={it.shot.full}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full transition duration-700 group-hover:scale-[1.03]">{it.cover}</div>
                  )}
                  <span className="mono absolute top-2.5 left-3 text-bone/80">{it.code}</span>
                  <span className="mono absolute top-2.5 right-3 inline-flex items-center gap-1.5 text-bone/80">
                    <span className={`size-1.5 rounded-full ${STATUS_DOT[it.status]}`} />
                    {it.statusLabel}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-medium transition-colors group-hover:text-signal">{it.title}</h3>
                  <span className="mono text-dim">{it.year}</span>
                </div>
                <p className="mono mt-1 text-dim">
                  {it.kindLabel}
                  {it.stack && (
                    <>
                      {" · "}
                      <span lang="en">{it.stack}</span>
                    </>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chips({
  label,
  value,
  onChange,
  all,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  all: string;
  options: { id: string; label: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <div className="mono flex gap-1">
        {[{ id: "all", label: all }, ...options].map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`shrink-0 rounded-full px-3 py-1 transition ${
              value === o.id ? "bg-bone text-ink" : "text-ash hover:text-bone"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
