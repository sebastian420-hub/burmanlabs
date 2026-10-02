"use client";

import { useState } from "react";
import { warmAll } from "./warm";

interface Props {
  urls: string[];
  labels: {
    button: string;
    hint: string;
    saving: string;
    done: string;
    failed: string;
    unsupported: string;
  };
}

type State = "idle" | "saving" | "done" | "failed" | "unsupported";

/** Asks the service worker to download the site for the current language. */
export default function SaveOffline({ urls, labels }: Props) {
  const [state, setState] = useState<State>("idle");

  async function save() {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      setState("unsupported");
      return;
    }
    setState("saving");
    try {
      const reg = await navigator.serviceWorker.ready;
      const swDone = new Promise<{ failed: number }>((resolve) => {
        const onMsg = (e: MessageEvent) => {
          if (e.data?.type !== "precache-done") return;
          navigator.serviceWorker.removeEventListener("message", onMsg);
          resolve({ failed: e.data.failed });
        };
        navigator.serviceWorker.addEventListener("message", onMsg);
        reg.active?.postMessage({ type: "precache", urls });
      });
      const [sw] = await Promise.all([swDone, warmAll()]);
      setState(sw.failed ? "failed" : "done");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        onClick={save}
        disabled={state === "saving"}
        className="rounded-xl border border-line px-4 py-2 font-medium hover:bg-panel-2 disabled:opacity-60"
      >
        {state === "saving" ? labels.saving : state === "done" ? `✓ ${labels.done}` : labels.button}
      </button>
      <span className="text-mist" role="status">
        {state === "failed"
          ? labels.failed
          : state === "unsupported"
            ? labels.unsupported
            : labels.hint}
      </span>
    </div>
  );
}
