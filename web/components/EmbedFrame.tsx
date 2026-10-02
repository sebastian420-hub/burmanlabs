"use client";

import { useState } from "react";

interface Props {
  url: string;
  title: string;
  labels: { load: string; note: string };
}

/** Click-to-load iframe: nothing from the embedded product downloads until the user asks. */
export default function EmbedFrame({ url, title, labels }: Props) {
  const [on, setOn] = useState(false);

  if (!on) {
    return (
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-panel p-6 text-center sm:aspect-video">
        <button
          type="button"
          onClick={() => setOn(true)}
          className="rounded-xl bg-ember px-6 py-3 font-bold text-ink hover:brightness-110"
        >
          {labels.load}
        </button>
        <p className="text-sm text-mist">{labels.note}</p>
      </div>
    );
  }
  return (
    <iframe
      src={url}
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      className="aspect-[4/3] w-full rounded-2xl border border-line bg-white sm:aspect-video"
    />
  );
}
