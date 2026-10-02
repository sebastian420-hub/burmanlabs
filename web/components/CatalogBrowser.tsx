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
  sample: boolean;
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
    sample: string;
  };
  digits: "my" | "en";
}

const TYPE_DOT: Record<string, string> = {
  textbook: "bg-ember",
  app: "bg-jade",
  sim: "bg-iris",
};

export default function CatalogBrowser({ items, categories, types, labels, digits }: Props) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState(params.get("cat") ?? "all");
  const [type, setType] = useState(params.get("type") ?? "all");

  // Substring match: Burmese has no spaces between words, so word-based search won't work.
  const haystacks = useMemo(
    () => items.map((i) => fold(`${i.title} ${i.titleAlt} ${i.summary} ${i.categoryLabel}`)),
    [items],
  );

  const needle = fold(q.trim());
  const shown = items.filter(
    (it, idx) =>
      (cat === "all" || it.category === cat) &&
      (type === "all" || it.type === type) &&
      (!needle || haystacks[idx].includes(needle)),
  );

  const n = num(shown.length, digits);

  return (
    <div>
      <label className="block">
        <span className="sr-only">{labels.searchLabel}</span>
        <input
          type="search"
          inputMode="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={labels.search}
          className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-base outline-none focus:border-ember"
        />
      </label>

      <Chips label={labels.categories} value={cat} onChange={setCat} all={labels.all} options={categories} />
      <Chips label={labels.types} value={type} onChange={setType} all={labels.all} options={types} />

      <p className="mt-5 text-sm text-mist" role="status">
        {labels.results.replace("{n}", n)}
      </p>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-mist">
          <p>{labels.empty}</p>
          <p className="mt-1 text-xs">{labels.zawgyi}</p>
        </div>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((it) => (
            <li key={it.id}>
              <Link
                href={it.href}
                className={`block h-full rounded-2xl border border-line bg-panel p-4 transition hover:border-ember/60 hover:bg-panel-2 ${
                  it.soon ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-mist">
                  <span className={`size-2 rounded-full ${TYPE_DOT[it.type] ?? "bg-mist"}`} />
                  {it.typeLabel} · {it.categoryLabel}
                </div>
                <h3 className="mt-2 text-lg font-bold">{it.title}</h3>
                <p className="mt-1 text-sm text-mist">{it.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {it.soon && <Badge>{labels.soon}</Badge>}
                  {it.offline && <Badge tone="jade">{labels.offline}</Badge>}
                  {it.sizeLabel && <Badge>{it.sizeLabel}</Badge>}
                  {it.sample && <Badge tone="ember">{labels.sample}</Badge>}
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
    <div className="mt-4" role="group" aria-label={label}>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: "all", label: all }, ...options].map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
              value === o.id
                ? "border-ember bg-ember text-ink font-bold"
                : "border-line text-mist hover:bg-panel-2"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "jade" | "ember" }) {
  const cls =
    tone === "jade"
      ? "border-jade/40 text-jade"
      : tone === "ember"
        ? "border-ember/40 text-ember"
        : "border-line text-mist";
  return <span className={`rounded-md border px-2 py-0.5 ${cls}`}>{children}</span>;
}
