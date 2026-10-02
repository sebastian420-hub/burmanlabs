/**
 * Shared render loop for the Studio pieces and other canvases.
 * - caps the pixel ratio and drops to 30 fps on low-end phones
 * - stops drawing when off-screen or when the tab is hidden
 * - with prefers-reduced-motion, draws only on resize and on explicit redraw()
 */
export interface ArtLoop {
  stop(): void;
  redraw(): void;
  readonly reduced: boolean;
  readonly lowEnd: boolean;
}

interface Options {
  /** CSS pixel size and the device pixel ratio to render at. */
  onResize: (width: number, height: number, dpr: number) => void;
  /** `t` is seconds since start, `dt` seconds since the previous frame (capped). */
  frame: (t: number, dt: number) => void;
  maxDpr?: number;
}

export function deviceProfile() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    lowEnd: (nav.hardwareConcurrency ?? 4) <= 4 || (nav.deviceMemory ?? 4) <= 2,
  };
}

export function artLoop(host: HTMLElement, { onResize, frame, maxDpr = 2 }: Options): ArtLoop {
  const { reduced, lowEnd } = deviceProfile();
  const frameMs = lowEnd ? 1000 / 30 : 0;
  const dprCap = lowEnd ? Math.min(1.5, maxDpr) : maxDpr;
  const t0 = performance.now();
  let last = t0;
  let lastFrame = 0;
  let raf = 0;
  let visible = true;
  let stopped = false;

  const draw = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    frame((now - t0) / 1000, dt);
  };

  const loop = (now: number) => {
    raf = 0;
    if (stopped || !visible || document.hidden) return;
    if (now - lastFrame >= frameMs) {
      lastFrame = now;
      draw(now);
    }
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    if (!raf && !reduced && !stopped && visible && !document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    onResize(w, h, Math.min(window.devicePixelRatio || 1, dprCap));
    if (reduced || !raf) draw(performance.now());
  };

  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", start);

  resize();
  start();

  return {
    reduced,
    lowEnd,
    redraw: () => {
      if (reduced) draw(performance.now());
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
    },
  };
}

/** Pointer position normalised to 0..1 inside an element. */
export function relPointer(el: HTMLElement, e: PointerEvent) {
  const r = el.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
}
