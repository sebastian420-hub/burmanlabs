"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { num, type Locale } from "@/lib/i18n";

export interface OrbitLabels {
  pause: string;
  play: string;
  restart: string;
  speed: string;
  distance: string;
  speedHint: string;
  result: string;
  circle: string;
  ellipse: string;
  escape: string;
  ecc: string;
  period: string;
  units: string;
  webgl: string;
  crashed: string;
  lost: string;
}

// Units: GM = 1, so a circular orbit at r has speed 1/sqrt(r).
const TIME_SCALE = 0.9; // simulated time units per real second
const STEP = 0.004;
const TRAIL = 900;

export default function OrbitSim({ labels, lang }: { labels: OrbitLabels; lang: Locale }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [r0, setR0] = useState(1.5);
  const [k, setK] = useState(1);
  const [playing, setPlaying] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const params = useRef({ r0, k, playing });
  const resetRef = useRef<() => void>(() => {});

  // Slider changes restart the run; the 3D scene itself is built only once.
  useEffect(() => {
    params.current = { r0, k, playing };
    resetRef.current();
  }, [r0, k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    params.current.playing = playing;
  }, [playing]);

  // The analytic answer, so the readout is always right regardless of frame rate.
  const result = useMemo(() => {
    const v = k / Math.sqrt(r0);
    const energy = (v * v) / 2 - 1 / r0;
    const h = r0 * v; // tangential launch
    const e = Math.sqrt(Math.max(0, 1 + 2 * energy * h * h));
    const kind = energy >= 0 ? "escape" : e < 0.05 ? "circle" : "ellipse";
    const a = energy < 0 ? -1 / (2 * energy) : Infinity;
    const period = energy < 0 ? 2 * Math.PI * Math.pow(a, 1.5) : Infinity;
    return { e, kind, period } as const;
  }, [r0, k]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      const id = window.setTimeout(() => setFailed(true), 0);
      return () => window.clearTimeout(id);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 3.9, 3.9);
    camera.lookAt(0, 0, 0);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xff3131 }),
    );
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xff3131, transparent: true, opacity: 0.16 }),
    );
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 24, 12),
      new THREE.MeshBasicMaterial({ color: 0xf2efe9 }),
    );
    scene.add(sun, glow, planet);

    // Faint polar grid, like the face of an instrument.
    const grid = new THREE.PolarGridHelper(4, 12, 8, 96, 0x2a2725, 0x1b1917);
    scene.add(grid);

    const ringGeo = new THREE.RingGeometry(1, 1.006, 128);
    ringGeo.rotateX(-Math.PI / 2);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({ color: 0xff3131, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    );
    scene.add(ring);

    const trailPos = new Float32Array(TRAIL * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({ color: 0xf2efe9, transparent: true, opacity: 0.9 }),
    );
    trail.frustumCulled = false;
    scene.add(trail);

    let x = 0, y = 0, vx = 0, vy = 0;
    let trailN = 0;
    let sinceTrail = 0;
    let pauseUntil = 0;
    let timer = 0;

    function reset() {
      window.clearTimeout(timer);
      pauseUntil = 0;
      const { r0, k } = params.current;
      x = r0;
      y = 0;
      vx = 0;
      vy = k / Math.sqrt(r0);
      trailN = 0;
      sinceTrail = 0;
      trailGeo.setDrawRange(0, 0);
      ring.scale.setScalar(r0);
      setNote(null);
    }
    resetRef.current = reset;

    function pushTrail() {
      if (trailN === TRAIL) {
        trailPos.copyWithin(0, 3);
        trailN--;
      }
      trailPos.set([x, 0, -y], trailN * 3); // sim y → scene -z so counter-clockwise from above
      trailN++;
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.setDrawRange(0, trailN);
    }

    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1 ? 45 / Math.max(0.6, w / h) : 45;
      camera.updateProjectionMatrix();
    }

    let last = performance.now();
    let raf = 0;
    let visible = true;

    function frame(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (now < pauseUntil) {
        // brief hold after a crash / escape so the message can be read
      } else if (params.current.playing) {
        let t = dt * TIME_SCALE;
        while (t > 0) {
          const h = Math.min(STEP, t);
          t -= h;
          // velocity Verlet
          const r2 = x * x + y * y;
          const r3 = r2 * Math.sqrt(r2);
          const ax = -x / r3;
          const ay = -y / r3;
          x += vx * h + 0.5 * ax * h * h;
          y += vy * h + 0.5 * ay * h * h;
          const r2n = x * x + y * y;
          const r3n = r2n * Math.sqrt(r2n);
          vx += 0.5 * (ax + -x / r3n) * h;
          vy += 0.5 * (ay + -y / r3n) * h;
        }
        const r = Math.hypot(x, y);
        sinceTrail += dt;
        if (sinceTrail > 0.016) {
          sinceTrail = 0;
          pushTrail();
        }
        if (r < 0.14) {
          setNote("crashed");
          pauseUntil = now + 1800;
          timer = window.setTimeout(reset, 1800);
        } else if (r > 7) {
          setNote("lost");
          pauseUntil = now + 1800;
          timer = window.setTimeout(reset, 1800);
        }
      }
      planet.position.set(x, 0, -y);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    const kick = () => {
      if (!raf && visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", kick);

    resize();
    reset();
    kick();

    return () => {
      window.clearTimeout(timer);
      resetRef.current = () => {};
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | undefined;
        mat?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  if (failed) return <p className="rounded-3xl border border-line p-6 text-ash">{labels.webgl}</p>;

  const fixed = (v: number, d = 2) => num(Number(v.toFixed(d)), lang).replace(".", lang === "my" ? "·" : ".");

  return (
    <div>
      <div
        ref={hostRef}
        role="img"
        aria-label={labels.result}
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-line bg-black sm:aspect-[16/9]"
      >
        {note && (
          <p className="absolute inset-x-0 top-3 z-10 mx-auto w-fit rounded-full bg-ink/80 px-4 py-1 text-sm text-signal backdrop-blur">
            {note === "crashed" ? labels.crashed : labels.lost}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
        <Slider
          label={labels.speed}
          hint={labels.speedHint}
          min={0.3}
          max={1.6}
          step={0.01}
          value={k}
          shown={fixed(k)}
          onChange={setK}
        />
        <Slider
          label={labels.distance}
          min={0.8}
          max={3}
          step={0.05}
          value={r0}
          shown={fixed(r0)}
          onChange={setR0}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-full border border-line-2 px-5 py-2 text-sm transition hover:border-bone/60"
        >
          {playing ? labels.pause : labels.play}
        </button>
        <button
          type="button"
          onClick={() => resetRef.current()}
          className="rounded-full border border-line-2 px-5 py-2 text-sm transition hover:border-bone/60"
        >
          {labels.restart}
        </button>
      </div>

      <dl className="mt-4 grid gap-6 rounded-3xl border border-line p-6 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">{labels.result}</dt>
          <dd className="mt-1 text-xl text-signal">{labels[result.kind]}</dd>
        </div>
        <div>
          <dt className="eyebrow">{labels.ecc}</dt>
          <dd className="display num mt-1 text-3xl">{fixed(result.e)}</dd>
        </div>
        {Number.isFinite(result.period) && (
          <div>
            <dt className="eyebrow">{labels.period}</dt>
            <dd className="display num mt-1 text-3xl">
              {fixed(result.period, 1)} {labels.units}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Slider({
  label,
  hint,
  min,
  max,
  step,
  value,
  shown,
  onChange,
}: {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  shown: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block bg-ink p-5">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="num font-medium text-signal">{shown}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-[#ff3131]"
      />
      {hint && <span className="mt-2 block text-xs text-dim">{hint}</span>}
    </label>
  );
}
