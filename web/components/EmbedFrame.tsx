"use client";

import { useState, useEffect } from "react";

interface Props {
  url: string;
  title: string;
  labels: { load: string; note: string };
  code?: string;
}

/**
 * Click-to-load iframe with Fullscreen Focus Deck capability.
 * Enables running EduSim, Artcodex, or Spikebook edge-to-edge inside the PWA without browser tabs.
 */
export default function EmbedFrame({ url, title, labels, code }: Props) {
  const [on, setOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Handle Escape key when fullscreen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Open Focus Deck on #focus-deck hash or anchor click
  useEffect(() => {
    function checkHash() {
      if (window.location.hash === "#focus-deck") {
        setOn(true);
        setIsFullscreen(true);
      }
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  // Lock background scroll when in Focus Deck
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  if (!on) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl sm:rounded-3xl border border-line bg-ink-2 p-6 text-center sm:aspect-video">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setOn(true)}
            className="rounded-full bg-bone px-6 py-2.5 font-mono text-xs font-semibold text-ink transition hover:bg-white active:scale-95 cursor-pointer shadow-md"
          >
            ▶ {labels.load}
          </button>
          <button
            type="button"
            onClick={() => {
              setOn(true);
              setIsFullscreen(true);
            }}
            className="rounded-full bg-ink-3 border border-line-2 px-5 py-2.5 font-mono text-xs text-bone hover:border-white transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>⛶</span>
            <span>Launch in Deck</span>
          </button>
        </div>
        <p className="text-xs text-dim font-mono">{labels.note}</p>
      </div>
    );
  }

  return (
    <>
      {/* Inline Frame */}
      <div className="relative group">
        <div className="flex items-center justify-between pb-2 font-mono text-xs text-muted">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-bone">{title}</span>
            {code && <span className="text-dim">({code})</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIframeKey((k) => k + 1)}
              className="px-2 py-0.5 rounded border border-line hover:border-bone/50 text-dim hover:text-bone transition-colors cursor-pointer"
              title="Reload frame"
            >
              ↻ Reload
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="px-2.5 py-0.5 rounded bg-ink-2 border border-line-2 hover:border-white text-bone transition-all flex items-center gap-1 cursor-pointer"
              title="Expand to Fullscreen Focus Deck"
            >
              <span>⛶</span>
              <span>Focus Deck</span>
            </button>
          </div>
        </div>

        <iframe
          key={iframeKey}
          src={url}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          className="aspect-[4/3] w-full rounded-2xl sm:rounded-3xl border border-line bg-black sm:aspect-video"
        />
      </div>

      {/* Fullscreen Deck Overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black text-bone h-[100dvh] max-h-[100dvh] overscroll-contain">
          {/* Deck Top Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-line bg-ink shrink-0 pt-[max(0.625rem,env(safe-area-inset-top,0px))] select-none">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded bg-ink-2 border border-line-2 hover:border-white text-bone font-mono text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Back to Lab</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-bone font-medium">{title}</span>
                {code && <span className="text-dim">[{code}]</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIframeKey((k) => k + 1)}
                className="px-2.5 py-1.5 rounded bg-ink-2 border border-line text-ash hover:text-white transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="Reload Simulation"
              >
                <span>↻</span>
                <span className="hidden sm:inline">Reload</span>
              </button>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded bg-ink-2 border border-line text-ash hover:text-white transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                title="Open raw external link in browser"
              >
                <span>↗</span>
                <span className="hidden sm:inline">Browser</span>
              </a>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded bg-bone text-ink font-semibold hover:bg-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                aria-label="Exit fullscreen"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Fullscreen Iframe */}
          <div className="flex-1 min-h-0 w-full h-full relative bg-black pb-[env(safe-area-inset-bottom,0px)]">
            <iframe
              key={`fs-${iframeKey}`}
              src={url}
              title={title}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              className="w-full h-full border-0 bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
