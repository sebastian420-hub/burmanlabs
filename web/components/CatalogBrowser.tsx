"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { fold, num } from "@/lib/i18n";

export interface BrowserItem {
  id: string;
  type: string;
  typeLabel: string;
  category: string;
  categoryLabel: string;
  title: string;
  titleAlt: string;
  summary: string;
  href: string;
  sizeLabel?: string;
  offline: boolean;
  soon: boolean;
  statusLabel: string;
  live: boolean;
  cover: React.ReactNode;
}

interface Props {
  items: BrowserItem[];
  categories: { id: string; label: string }[];
  types: { id: string; label: string }[];
  labels: {
    search: string;
    searchLabel: string;
    all: string;
    categories: string;
    types: string;
    results: string; // contains {n}
    empty: string;
    zawgyi: string;
    offline: string;
    soon: string;
  };
  digits: "my" | "en";
}

export default function CatalogBrowser({ items, categories, types, labels, digits }: Props) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState(params.get("cat") ?? "all");
  const [type, setType] = useState(params.get("type") ?? "all");

  // Substring match: Burmese has no spaces between words, so word-based search won't work.
  const haystacks = useMemo(
    () => items.map((i) => fold(`${i.title} ${i.titleAlt} ${i.summary} ${i.categoryLabel} ${i.typeLabel}`)),
    [items],
  );

  const needle = fold(q.trim());
  const shown = items.filter(
    (it, idx) =>
      (cat === "all" || it.category === cat) &&
      (type === "all" || it.type === type) &&
      (!needle || haystacks[idx].includes(needle)),
  );

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-5 border-b border-line bg-ink/85 px-5 pt-4 pb-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <label className="relative block">
          <span className="sr-only">{labels.searchLabel}</span>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="pointer-events-none absolute top-1/2 left-0 size-5 -translate-y-1/2 text-dim"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            inputMode="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.search}
            className="w-full border-0 border-b border-line-2 bg-transparent py-3 pl-8 text-xl outline-none placeholder:text-dim focus:border-bone"
          />
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <Chips label={labels.types} value={type} onChange={setType} all={labels.all} options={types} />
          <span className="hidden h-5 w-px bg-line sm:block" />
          <Chips label={labels.categories} value={cat} onChange={setCat} all={labels.all} options={categories} />
        </div>
      </div>

      <p className="eyebrow num mt-6" role="status">
        {labels.results.replace("{n}", num(shown.length, digits))}
      </p>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line-2 p-12 text-center text-ash">
          <p>{labels.empty}</p>
          <p className="mt-1 text-xs text-dim">{labels.zawgyi}</p>
        </div>
      ) : (
        <ul className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((it) => (
            <li key={it.id}>
              <Link href={it.href} className="group block">
                <div
                  className={`relative aspect-[400/260] overflow-hidden rounded-2xl border border-line transition duration-500 group-hover:border-line-2 ${
                    it.soon ? "opacity-80" : ""
                  }`}
                >
                  <div className="h-full w-full transition duration-700 group-hover:scale-[1.04]">{it.cover}</div>
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Pill tone={it.live ? undefined : "signal"}>{it.statusLabel}</Pill>
                    {it.soon && <Pill>{labels.soon}</Pill>}
                    {it.offline && <Pill>{labels.offline}</Pill>}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="eyebrow">
                    {it.typeLabel} · {it.categoryLabel}
                  </p>
                  <h3 className="mt-1.5 text-xl font-medium transition-colors group-hover:text-signal">
                    {it.title}
                  </h3>
                  <p className="mt-1 text-sm text-ash">{it.summary}</p>
                  {it.sizeLabel && <p className="mt-2 text-xs text-dim">{it.sizeLabel}</p>}
                </div>
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
      <div className="flex gap-1.5">
        {[{ id: "all", label: all }, ...options].map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`shrink-0 rounded-full px-3.5 py-1 text-sm transition ${
              value === o.id ? "bg-bone font-medium text-ink" : "text-ash hover:bg-ink-3 hover:text-bone"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone?: "signal" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] backdrop-blur-md ${
        tone === "signal" ? "bg-signal/90 text-ink" : "bg-black/60 text-bone"
      }`}
    >
      {children}
    </span>
  );
}
