"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { PieceId } from "@/content/studio";
import { canRun3D } from "@/lib/capability";

const PIECES: Record<PieceId, React.ComponentType> = {
  quantum: dynamic(() => import("./art/Quantum"), { ssr: false }),
  pulse: dynamic(() => import("./art/Pulse"), { ssr: false }),
  mandalay: dynamic(() => import("./art/Mandalay"), { ssr: false }),
  binary: dynamic(() => import("./art/BinaryRain"), { ssr: false }),
};

interface Props {
  id: PieceId;
  title: string;
  webgl: boolean;
  labels: { play: string; playNote: string };
}

/**
 * Shows the poster first, then the live piece. Canvas pieces start straight away;
 * WebGL pieces start automatically only when the device and connection allow it,
 * otherwise they wait for a tap.
 */
export default function ArtStage({ id, title, webgl, labels }: Props) {
  const [live, setLive] = useState<"pending" | "on" | "ask">("pending");

  useEffect(() => {
    const next = !webgl || canRun3D() ? "on" : "ask";
    const t = window.setTimeout(() => setLive(next), 0);
    return () => window.clearTimeout(t);
  }, [webgl]);

  const Piece = PIECES[id];

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Image
        src={`/studio/${id}.webp`}
        alt={title}
        fill
        sizes="100vw"
        priority
        className={`object-cover transition-opacity duration-700 ${live === "on" ? "opacity-0" : "opacity-100"}`}
      />
      {live === "on" && <Piece />}
      {live === "ask" && (
        <div className="absolute inset-0 grid place-items-center bg-black/40">
          <div className="text-center">
            <button
              type="button"
              onClick={() => setLive("on")}
              className="rounded-full bg-bone px-7 py-3 text-sm font-semibold text-ink transition hover:bg-white"
            >
              ▶ {labels.play}
            </button>
            <p className="mt-3 text-xs text-bone/70">{labels.playNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
