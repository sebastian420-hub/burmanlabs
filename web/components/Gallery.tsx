"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";

interface GalleryProps {
  gallery: { shot: string; caption: Record<Locale, string> }[];
  lang: Locale;
}

export default function Gallery({ gallery, lang }: GalleryProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handleNext = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % gallery.length);
  }, [selectedIdx, gallery.length]);

  const handlePrev = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + gallery.length) % gallery.length);
  }, [selectedIdx, gallery.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIdx, handleNext, handlePrev]);

  if (!gallery || gallery.length === 0) return null;

  const gridClass =
    gallery.length === 5
      ? "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
      : gallery.length === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <>
      <ul className={`mt-5 grid gap-x-5 gap-y-7 ${gridClass}`}>
        {gallery.map((g, i) => (
          <li key={g.shot}>
            <button
              type="button"
              onClick={() => setSelectedIdx(i)}
              className="group block w-full text-left focus:outline-none"
            >
              <div className="relative aspect-[16/10] overflow-hidden border border-line bg-ink-2 transition duration-300 group-hover:border-line-2">
                <Image
                  src={`/work/${g.shot}.webp`}
                  alt={g.caption[lang]}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <span className="mono absolute right-2 bottom-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] text-bone/70 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  {lang === "my" ? "ချဲ့ကြည့်မည်" : "Expand"} ↗
                </span>
              </div>
              <p className="mt-2.5 flex items-baseline gap-3 text-[15px] text-bone/90 transition-colors group-hover:text-signal">
                <span className="mono text-dim">{String(i + 1).padStart(2, "0")}</span>
                <span>{g.caption[lang]}</span>
              </p>
            </button>
          </li>
        ))}
      </ul>

      {/* Lightbox Modal */}
      {selectedIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 p-4 backdrop-blur-md sm:p-8"
          onClick={() => setSelectedIdx(null)}
        >
          {/* Top Control Bar */}
          <div
            className="flex items-center justify-between border-b border-line pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mono text-xs text-ash sm:text-sm">
              <span className="text-signal">
                {String(selectedIdx + 1).padStart(2, "0")}
              </span>{" "}
              / {String(gallery.length).padStart(2, "0")}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="mono flex size-9 items-center justify-center rounded-full border border-line bg-ink-2 text-bone transition hover:border-bone"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="mono flex size-9 items-center justify-center rounded-full border border-line bg-ink-2 text-bone transition hover:border-bone"
                aria-label="Next image"
              >
                →
              </button>
              <button
                type="button"
                onClick={() => setSelectedIdx(null)}
                className="mono ml-2 rounded-full border border-line px-4 py-1.5 text-xs text-bone transition hover:border-bone"
              >
                {lang === "my" ? "ပိတ်မည်" : "Close"} [Esc]
              </button>
            </div>
          </div>

          {/* Main Stage Image */}
          <div
            className="relative my-4 flex flex-1 items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-full max-h-[75vh] w-full max-w-6xl">
              <Image
                src={`/work/${gallery[selectedIdx].shot}.webp`}
                alt={gallery[selectedIdx].caption[lang]}
                fill
                priority
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>

          {/* Bottom Caption */}
          <div
            className="mx-auto w-full max-w-3xl border-t border-line pt-3 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm leading-relaxed text-bone sm:text-base">
              {gallery[selectedIdx].caption[lang]}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
