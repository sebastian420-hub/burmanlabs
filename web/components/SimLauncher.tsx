"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { OrbitLabels } from "./OrbitSim";

// Three.js is only downloaded after the first tap.
const OrbitSim = dynamic(() => import("./OrbitSim"), {
  ssr: false,
  loading: () => <div className="aspect-[4/3] animate-pulse rounded-2xl bg-panel sm:aspect-video" />,
});

interface Props {
  lang: Locale;
  start: string;
  note: string;
  labels: OrbitLabels;
}

export default function SimLauncher({ lang, start, note, labels }: Props) {
  const [on, setOn] = useState(false);

  if (on) return <OrbitSim labels={labels} lang={lang} />;

  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-panel p-6 text-center sm:aspect-video">
      <button
        type="button"
        onClick={() => setOn(true)}
        className="rounded-xl bg-ember px-8 py-3 text-lg font-bold text-ink hover:brightness-110"
      >
        ▶ {start}
      </button>
      <p className="text-sm text-mist">{note}</p>
    </div>
  );
}
