"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LAND_B64, LAND_H, LAND_W } from "@/lib/landMask";

export type GlobeItem = { id: string; type: "textbook" | "app" | "sim" };

interface Props {
  items: GlobeItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Myanmar (Naypyidaw-ish): the globe always settles facing here.
const HOME = { lat: 21.5, lon: 96 };
const TYPE_COLOR: Record<GlobeItem["type"], string> = {
  textbook: "#f2efe9",
  app: "#c9a45c",
  sim: "#ff3131",
};

const rad = (d: number) => (d * Math.PI) / 180;
const toVec = (lat: number, lon: number, r = 1) =>
  new THREE.Vector3(
    r * Math.cos(lat) * Math.sin(lon),
    r * Math.sin(lat),
    r * Math.cos(lat) * Math.cos(lon),
  );

function decodeLand() {
  const bin = atob(LAND_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return (lat: number, lon: number) => {
    const x = Math.min(LAND_W - 1, Math.max(0, Math.floor(lon + 180)));
    const y = Math.min(LAND_H - 1, Math.max(0, Math.floor(90 - lat)));
    const i = y * LAND_W + x;
    return ((bytes[i >> 3] >> (i & 7)) & 1) === 1;
  };
}

const DOT_VERT = /* glsl */ `
  attribute float aBoost;
  uniform float uPx;
  varying float vBoost;
  void main() {
    vBoost = aBoost;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPx * (1.0 + aBoost * 0.7) * (4.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const DOT_FRAG = /* glsl */ `
  varying float vBoost;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 base = vec3(0.95, 0.93, 0.90);
    vec3 hot = vec3(1.0, 0.19, 0.19);
    gl_FragColor = vec4(mix(base, hot, vBoost), smoothstep(0.5, 0.3, d) * (0.32 + 0.68 * vBoost));
  }
`;
const NODE_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aPhase;
  attribute float aSel;
  uniform float uPx;
  uniform float uTime;
  varying vec3 vColor;
  varying float vSel;
  void main() {
    vColor = aColor;
    vSel = aSel;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float pulse = 0.85 + 0.25 * sin(uTime * 2.0 + aPhase);
    gl_PointSize = uPx * (3.4 + aSel * 2.6) * pulse * (4.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const NODE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vSel;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = smoothstep(0.38, 0.0, d);
    float halo = pow(1.0 - d, 2.2);
    vec3 c = mix(vColor, vec3(1.0), core * 0.85 + vSel * 0.3);
    gl_FragColor = vec4(c, clamp(halo * 0.9 + core, 0.0, 1.0));
  }
`;
const ATMO_VERT = /* glsl */ `
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ATMO_FRAG = /* glsl */ `
  varying vec3 vN;
  void main() {
    float i = pow(max(0.0, 0.7 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.6);
    gl_FragColor = vec4(1.0, 0.92, 0.86, 1.0) * i * 0.55;
  }
`;

export default function Globe({ items, selectedId, onSelect }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Latest props, readable from the long-lived render loop without re-creating the scene.
  const live = useRef({ selectedId, onSelect, items });
  const selectRef = useRef<(id: string | null) => void>(() => {});

  useEffect(() => {
    live.current = { selectedId, onSelect, items };
    selectRef.current(selectedId);
  }, [selectedId, onSelect, items]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowEnd = (nav.hardwareConcurrency ?? 4) <= 4 || (nav.deviceMemory ?? 4) <= 2;
    const frameMs = lowEnd ? 1000 / 30 : 0;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowEnd,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const maxDpr = lowEnd ? 1.5 : 2;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0, 4.2);

    const globe = new THREE.Group();
    scene.add(globe);

    const homeLat = rad(HOME.lat);
    const homeLon = rad(HOME.lon);
    const home = toVec(homeLat, homeLon);

    // Ocean disc: hides the far-side dots and gives the dark body of the planet.
    globe.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.985, 48, 32),
        new THREE.MeshBasicMaterial({ color: 0x0b0a09 }),
      ),
    );

    // Land as a lattice of dots. Brighter near Myanmar.
    const isLand = decodeLand();
    const N = 12000;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const dotPos: number[] = [];
    const dotBoost: number[] = [];
    for (let i = 0; i < N; i++) {
      const y = 1 - (2 * (i + 0.5)) / N;
      const r = Math.sqrt(1 - y * y);
      const th = i * golden;
      const x = Math.cos(th) * r;
      const z = Math.sin(th) * r;
      const lat = Math.asin(y);
      const lon = Math.atan2(x, z);
      if (!isLand((lat * 180) / Math.PI, (lon * 180) / Math.PI)) continue;
      dotPos.push(x, y, z);
      const ang = Math.acos(Math.min(1, x * home.x + y * home.y + z * home.z));
      dotBoost.push(Math.max(0, 1 - ang / rad(11)));
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dotPos, 3));
    dotGeo.setAttribute("aBoost", new THREE.Float32BufferAttribute(dotBoost, 1));
    const dotMat = new THREE.ShaderMaterial({
      vertexShader: DOT_VERT,
      fragmentShader: DOT_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: { uPx: { value: 4 } },
    });
    globe.add(new THREE.Points(dotGeo, dotMat));

    // One light per catalog item, fanned out in a cap around Myanmar.
    const its = live.current.items;
    const n = its.length;
    const up = Math.abs(home.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const e1 = new THREE.Vector3().crossVectors(home, up).normalize();
    const e2 = new THREE.Vector3().crossVectors(home, e1).normalize();
    const cap = Math.min(1.1, 0.3 + 0.045 * Math.sqrt(n) * 2);
    const nodePos = new Float32Array(n * 3);
    const nodeCol = new Float32Array(n * 3);
    const nodePhase = new Float32Array(n);
    const nodeSel = new Float32Array(n);
    const col = new THREE.Color();
    its.forEach((it, i) => {
      const a = cap * Math.sqrt((i + 0.5) / n);
      const b = i * golden;
      const p = home
        .clone()
        .multiplyScalar(Math.cos(a))
        .addScaledVector(e1, Math.sin(a) * Math.cos(b))
        .addScaledVector(e2, Math.sin(a) * Math.sin(b))
        .multiplyScalar(1.012);
      nodePos.set([p.x, p.y, p.z], i * 3);
      col.set(TYPE_COLOR[it.type]);
      nodeCol.set([col.r, col.g, col.b], i * 3);
      nodePhase[i] = (i * 1.7) % (Math.PI * 2);
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
    nodeGeo.setAttribute("aColor", new THREE.BufferAttribute(nodeCol, 3));
    nodeGeo.setAttribute("aPhase", new THREE.BufferAttribute(nodePhase, 1));
    const selAttr = new THREE.BufferAttribute(nodeSel, 1);
    nodeGeo.setAttribute("aSel", selAttr);
    const nodeMat = new THREE.ShaderMaterial({
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPx: { value: 4 }, uTime: { value: 0 } },
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    nodes.frustumCulled = false;
    globe.add(nodes);

    // Atmosphere rim.
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.14, 48, 32),
        new THREE.ShaderMaterial({
          vertexShader: ATMO_VERT,
          fragmentShader: ATMO_FRAG,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthWrite: false,
        }),
      ),
    );

    // --- state ---------------------------------------------------------------
    let yaw = 0; // user offset
    let pitch = 0;
    let vel = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let moved = 0;
    let lastInteract = -Infinity;
    let visible = true;
    let raf = 0;
    let lastFrame = 0;
    let disposed = false;

    const setSelection = (id: string | null) => {
      its.forEach((it, i) => (nodeSel[i] = it.id === id ? 1 : 0));
      selAttr.needsUpdate = true;
      if (reduced) draw(performance.now());
    };
    selectRef.current = setSelection;
    setSelection(live.current.selectedId);

    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Keep the whole globe in frame on narrow (portrait) screens.
      camera.fov = w / h < 1 ? 40 / Math.max(0.62, w / h) : 40;
      camera.updateProjectionMatrix();
      const px = Math.max(1.6 * dpr, Math.min(w, h) * dpr * 0.0062);
      dotMat.uniforms.uPx.value = px;
      nodeMat.uniforms.uPx.value = px;
    }

    function draw(now: number) {
      const t = now / 1000;
      const idle = now - lastInteract > 3500;
      if (!dragging) {
        yaw += vel;
        vel *= 0.94;
        if (idle) {
          yaw *= 0.985;
          pitch *= 0.985;
        }
      }
      const sway = reduced ? 0 : Math.sin(t * 0.22) * 0.1;
      globe.rotation.set(homeLat * 0.9 + pitch, -homeLon + yaw + sway, 0);
      nodeMat.uniforms.uTime.value = reduced ? 0 : t;
      renderer.render(scene, camera);
    }

    function loop(now: number) {
      raf = 0;
      if (disposed || !visible || document.hidden) return;
      if (now - lastFrame >= frameMs) {
        lastFrame = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    }
    const start = () => {
      if (!raf && !reduced && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    // --- input ---------------------------------------------------------------
    const ray = new THREE.Raycaster();
    ray.params.Points = { threshold: 0.075 };
    const ndc = new THREE.Vector2();
    const wp = new THREE.Vector3();

    function pick(clientX: number, clientY: number) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1));
      ray.setFromCamera(ndc, camera);
      globe.updateMatrixWorld(true);
      const hits = ray.intersectObject(nodes, false);
      let best: { i: number; d: number } | null = null;
      for (const h of hits) {
        if (h.index == null) continue;
        wp.fromBufferAttribute(nodeGeo.getAttribute("position") as THREE.BufferAttribute, h.index);
        wp.applyMatrix4(globe.matrixWorld);
        if (wp.z < 0.15) continue; // far side
        const d = h.distanceToRay ?? 0;
        if (!best || d < best.d) best = { i: h.index, d };
      }
      return best ? its[best.i].id : null;
    }

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = downX = e.clientX;
      lastY = downY = e.clientY;
      moved = 0;
      vel = 0;
      lastInteract = performance.now();
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
      lastInteract = performance.now();
      yaw += dx * 0.006;
      vel = dx * 0.0015;
      if (e.pointerType === "mouse") pitch = Math.max(-0.6, Math.min(0.6, pitch + dy * 0.004));
      if (reduced) draw(performance.now());
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      canvas.style.cursor = "grab";
      lastInteract = performance.now();
      if (moved < 8) {
        const id = pick(e.clientX, e.clientY);
        live.current.onSelect(id);
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost);

    const ro = new ResizeObserver(() => {
      resize();
      draw(performance.now());
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(host);
    const onVis = () => start();
    document.addEventListener("visibilitychange", onVis);

    resize();
    draw(performance.now());
    start();

    return () => {
      disposed = true;
      selectRef.current = () => {};
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("webglcontextlost", onLost);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
    // The scene is built once per mount; props reach it through `live`/`selectRef`.
  }, []);

  return <div ref={hostRef} className="absolute inset-0" />;
}
