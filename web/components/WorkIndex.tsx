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
  works: string; // {n}: "3 works"
  expand: string; // {title}
  collapse: string; // {title}
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
  /** Topics shown as one row that opens in place. Filtering or searching shows the flat list instead. */
  groups?: string[];
}

/** What the index draws: a plain item, or a group row with (when open) its items right after it. */
type Row =
  | { kind: "item"; it: IndexItem; child: boolean }
  | { kind: "group"; id: string; label: string; members: IndexItem[]; open: boolean };

const STATUS_DOT: Record<IndexItem["status"], string> = {
  live: "bg-gold",
  ongoing: "bg-signal",
  learning: "bg-ash",
};

/** The picture a group stands for: the first of its items that has a real screenshot. */
const groupShot = (members: IndexItem[]) => members.find((m) => m.shot)?.shot;

export default function WorkIndex({ items, labels, digits, filters, initial, defaultView = "list", groups = [] }: Props) {
  const [view, setView] = useState<"list" | "grid">(defaultView);
  const [q, setQ] = useState(initial?.q ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "all");
  const [cat, setCat] = useState(initial?.cat ?? "all");
  const [hover, setHover] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [fancy, setFancy] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
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

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

  // Group only the unfiltered list: a search or filter should show every match at once.
  const flat = Boolean(needle) || kind !== "all" || cat !== "all";
  const rows: Row[] = [];
  const done = new Set<string>();
  for (const it of shown) {
    if (flat || !groups.includes(it.category)) {
      rows.push({ kind: "item", it, child: false });
      continue;
    }
    if (done.has(it.category)) continue;
    done.add(it.category);
    const members = shown.filter((m) => m.category === it.category);
    if (members.length < 2) {
      rows.push({ kind: "item", it, child: false }); // one piece needs no group
      continue;
    }
    const isOpen = open.has(it.category);
    rows.push({ kind: "group", id: it.category, label: it.categoryLabel, members, open: isOpen });
    if (isOpen) for (const m of members) rows.push({ kind: "item", it: m, child: true });
  }

  const works = (n: number) => labels.works.replace("{n}", num(n, digits));
  const names = (members: IndexItem[]) => members.map((m) => m.title).join(" · ");
  const statusText = (members: IndexItem[]) => [...new Set(members.map((m) => m.statusLabel))].join(", ");
  const dots = (members: IndexItem[]) =>
    members.map((m) => <span key={m.id} className={`size-1.5 rounded-full ${STATUS_DOT[m.status]}`} />);

  // Hover and focus drive the preview. A row is keyed by an id; groups use "g:{topic}".
  const enter = (id: string, shot?: IndexItem["shot"], anchor?: { x: number; y: number }) => {
    setHover(id);
    // Rows without a screenshot clear the preview rather than leaving the last one up.
    setPreview(fancy && shot ? { src: shot.full, anchor } : null);
  };
  const leave = () => {
    setHover(null);
    setPreview(null);
  };
  const focusRow = (id: string, shot?: IndexItem["shot"]) => {
    const el = rowRefs.current.get(id);
    if (!el) return enter(id, shot);
    const r = el.getBoundingClientRect();
    enter(id, shot, { x: Math.min(innerWidth - 190, r.right - 200), y: r.top + r.height / 2 });
  };
  const setRef = (id: string) => (el: HTMLElement | null) => {
    if (el) rowRefs.current.set(id, el);
  };

  const circle =
    "grid size-8 place-items-center justify-self-end rounded-full border border-line text-ash transition duration-300 group-hover:border-signal group-hover:bg-signal group-hover:text-ink";
  const rowGrid =
    "group grid min-h-[72px] grid-cols-[4.5rem_1fr_2.5rem] items-center gap-x-3 py-3 md:min-h-[64px] md:grid-cols-[4.5rem_1fr_7rem_1fr_7.5rem_3.5rem_2.5rem] md:gap-x-4 md:py-0";
  const titleCls =
    "block truncate text-[1.05rem] font-medium text-bone transition-colors group-hover:text-signal md:text-lg";

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
            {rows.map((r) => {
              if (r.kind === "group") {
                const id = `g:${r.id}`;
                const shot = groupShot(r.members);
                return (
                  <li key={id} className="row border-b border-line" data-on={hover === id ? "1" : "0"} data-group="1">
                    <button
                      type="button"
                      aria-expanded={r.open}
                      ref={setRef(id)}
                      onClick={() => toggle(r.id)}
                      onMouseEnter={() => enter(id, shot)}
                      onFocus={() => focusRow(id, shot)}
                      onBlur={leave}
                      className={`${rowGrid} w-full cursor-pointer text-left`}
                    >
                      <span className="mono text-dim">×{num(r.members.length, digits)}</span>
                      <span className="min-w-0">
                        <span className={titleCls}>{r.label}</span>
                        {/* Phone: the facts on a second line */}
                        <span className="mono mt-1 flex flex-wrap items-center gap-x-2 text-dim md:hidden">
                          <span>{works(r.members.length)}</span>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1" aria-hidden>
                            {dots(r.members)}
                          </span>
                        </span>
                        <span className="sr-only">
                          {(r.open ? labels.collapse : labels.expand).replace("{title}", r.label)}
                        </span>
                      </span>
                      <span className="mono hidden text-ash md:block">{works(r.members.length)}</span>
                      <span className="mono hidden truncate text-ash md:block" lang="en">
                        {names(r.members)}
                      </span>
                      <span className="mono hidden items-center gap-1.5 text-ash md:flex" title={statusText(r.members)}>
                        {dots(r.members)}
                        <span className="sr-only">{statusText(r.members)}</span>
                      </span>
                      <span className="mono hidden text-ash md:block" aria-hidden>
                        —
                      </span>
                      <span aria-hidden className={circle}>
                        {r.open ? "−" : "+"}
                      </span>
                    </button>
                  </li>
                );
              }
              const it = r.it;
              return (
                <li
                  key={it.id}
                  className={`row border-b border-line ${r.child ? "row-in bg-ink-2/50 shadow-[inset_2px_0_0_var(--color-line-2)]" : ""}`}
                  data-on={hover === it.id ? "1" : "0"}
                >
                  <Link
                    href={it.href}
                    ref={setRef(it.id)}
                    onMouseEnter={() => enter(it.id, it.shot)}
                    onFocus={() => focusRow(it.id, it.shot)}
                    onBlur={leave}
                    className={rowGrid}
                  >
                    <span className="mono text-dim">{it.code}</span>
                    <span className="min-w-0">
                      <span className={titleCls}>{it.title}</span>
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
                    <span aria-hidden className={circle}>
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {fancy && <HoverPreview target={preview} />}
        </div>
      ) : (
        <ul className="mt-6 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            if (r.kind === "group") {
              const shot = groupShot(r.members);
              return (
                <li key={`g:${r.id}`} data-group="1">
                  <button
                    type="button"
                    aria-expanded={r.open}
                    onClick={() => toggle(r.id)}
                    className="group block w-full cursor-pointer text-left"
                  >
                    <div className="relative">
                      {/* Two sheets behind the card say "there is a stack here"; they fold away when it is open. */}
                      <div
                        aria-hidden
                        className={`absolute inset-0 translate-x-4 translate-y-4 border border-line bg-ink-2/40 transition duration-500 ${r.open ? "translate-x-0 translate-y-0 opacity-0" : ""}`}
                      />
                      <div
                        aria-hidden
                        className={`absolute inset-0 translate-x-2 translate-y-2 border border-line bg-ink-2/70 transition duration-500 ${r.open ? "translate-x-0 translate-y-0 opacity-0" : ""}`}
                      />
                      <div className="relative aspect-[16/10] overflow-hidden border border-line bg-ink-2 transition duration-500 group-hover:border-line-2">
                        {/* While open, its items are on show right after it, so the picture steps back. */}
                        <div className={`absolute inset-0 transition duration-500 ${r.open ? "opacity-30 grayscale" : ""}`}>
                          {shot ? (
                            <Image
                              src={shot.full}
                              alt=""
                              fill
                              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                              className="object-cover transition duration-700 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="h-full w-full transition duration-700 group-hover:scale-[1.03]">{r.members[0].cover}</div>
                          )}
                        </div>
                        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-linear-to-b from-ink/85 to-transparent" />
                        <span className="mono absolute top-2.5 left-3 z-20 text-bone/80">×{num(r.members.length, digits)}</span>
                        <span aria-hidden className="mono absolute top-2.5 right-3 z-20 text-bone/80">
                          {r.open ? "−" : "+"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <h3 className="text-lg font-medium transition-colors group-hover:text-signal">{r.label}</h3>
                      <span className="mono text-dim">{works(r.members.length)}</span>
                    </div>
                    <p className="mono mt-1 truncate text-dim" lang="en">
                      {names(r.members)}
                    </p>
                    <span className="sr-only">{(r.open ? labels.collapse : labels.expand).replace("{title}", r.label)}</span>
                  </button>
                </li>
              );
            }
            const it = r.it;
            return (
              <li key={it.id} className={r.child ? "row-in" : undefined}>
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
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-linear-to-b from-ink/85 to-transparent" />
                    <span className="mono absolute top-2.5 left-3 z-20 text-bone/80">{it.code}</span>
                    <span className="mono absolute top-2.5 right-3 z-20 inline-flex items-center gap-1.5 text-bone/80">
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
            );
          })}
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
