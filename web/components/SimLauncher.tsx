"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { OrbitLabels } from "./OrbitSim";

// Three.js is only downloaded after the first tap.
const OrbitSim = dynamic(() => import("./OrbitSim"), {
  ssr: false,
  loading: () => <div className="aspect-[4/3] animate-pulse rounded-3xl bg-ink-2 sm:aspect-[16/9]" />,
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
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-black sm:aspect-[16/9]">
      <Image src="/studio/orbit.webp" alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/70 via-black/10 to-transparent">
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOn(true)}
            className="group inline-flex items-center gap-3 rounded-full bg-bone py-3 pr-7 pl-3 text-lg font-medium text-ink transition hover:bg-white"
          >
            <span className="grid size-9 place-items-center rounded-full bg-signal text-sm text-ink">▶</span>
            {start}
          </button>
          <p className="mt-3 text-sm text-bone/70">{note}</p>
        </div>
      </div>
    </div>
  );
}
