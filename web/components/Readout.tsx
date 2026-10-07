"use client";

import { useEffect, useState } from "react";

/**
 * The lab's position and local time, in the data voice. Real numbers only:
 * Mandalay at 21.98°N 96.08°E, clock in Asia/Yangon (UTC+6:30).
 * The clock is filled in after mount so server and client HTML match.
 */
export default function Readout({ place, local, extra }: { place: string; local: string; extra?: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Yangon",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 15000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  return (
    <p className="mono flex flex-wrap items-center gap-x-3 gap-y-1 text-dim">
      <span className="text-ash">21.98°N 96.08°E</span>
      <span aria-hidden>·</span>
      <span>{place}</span>
      <span aria-hidden>·</span>
      <span className="tabular-nums">
        <span className="text-ash">{time ?? "--:--"}</span> {local}
      </span>
      {extra && (
        <>
          <span aria-hidden>·</span>
          <span>{extra}</span>
        </>
      )}
    </p>
  );
}
