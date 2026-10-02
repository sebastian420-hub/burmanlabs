"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { artLoop } from "@/lib/artLoop";

/**
 * "Pulse" — port of Portfolio/x7.html ("Pulse Studio") to a self-contained component.
 * Thirty-five interpolated ovals drawn as one continuous line, breathing with two
 * waves while colour drifts through the spectrum. Tap cycles the original presets.
 */
const BASE = {
  outerRadius: 3.2,
  innerOvalX: 0.9,
  innerOvalY: 1.0,
  tubeRadius: 0.08,
  segments: 280,
  loops: 35,
  waveSpeed: 0.03,
  waveAmplitude: 0.2,
  rotationSpeed: 0.005,
  secondaryWave: 1.0,
  patternFlow: 0.4,
  colorGradient: 1,
};
type Config = typeof BASE;

// Same presets as the original control panel; "original" is its default state.
const PRESETS: Partial<Config>[] = [
  {},
  { outerRadius: 3, innerOvalX: 2, innerOvalY: 1, waveAmplitude: 0.8, secondaryWave: 0.5, patternFlow: 0.5 },
  { outerRadius: 4, innerOvalX: 3, innerOvalY: 2, waveAmplitude: 1.2, secondaryWave: 0.8, patternFlow: 0.7 },
  { outerRadius: 5, innerOvalX: 1, innerOvalY: 3, waveAmplitude: 1.5, secondaryWave: 1, patternFlow: 1 },
];

export default function Pulse({ onPreset }: { onPreset?: (i: number) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const presetCb = useRef(onPreset);
  useEffect(() => {
    presetCb.current = onPreset;
  }, [onPreset]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 1);
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:manipulation;cursor:pointer";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 10;

    let cfg: Config = { ...BASE };
    let preset = 0;
    const count = (cfg.segments + 1) * cfg.loops;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.8 }),
    );
    line.frustumCulled = false;
    scene.add(line);

    const color = new THREE.Color();
    let time = 0;
    let aspect = 1;

    function update() {
      const { loops, segments, innerOvalX, innerOvalY, outerRadius, patternFlow, secondaryWave, waveAmplitude, tubeRadius, colorGradient } = cfg;
      const secondaryTimeFactor = Math.sin(time * 0.5) * secondaryWave;
      for (let j = 0; j < loops; j++) {
        const loopOffset = (j / loops) * Math.PI * 2;
        const ratio = j / loops;
        const rx = innerOvalX * (1 - ratio) + outerRadius * ratio;
        const ry = innerOvalY * (1 - ratio) + outerRadius * ratio;
        const variation = 1 + Math.sin(ratio * Math.PI * 2 + time * patternFlow) * 0.2;
        for (let i = 0; i <= segments; i++) {
          const k = (j * (segments + 1) + i) * 3;
          const t = (i / segments) * Math.PI * 2;
          const primary = Math.sin(t + time) * waveAmplitude;
          const secondary = Math.cos(t * 2 + time * 1.5) * secondaryWave;
          const waveOffset =
            primary * Math.sin(ratio * Math.PI + time * 0.5) + secondary * Math.cos(ratio * Math.PI * 2 + time);
          positions[k] = (rx * variation + tubeRadius * Math.cos(t)) * Math.cos(t + loopOffset + secondaryTimeFactor);
          positions[k + 1] = (ry * variation + tubeRadius * Math.cos(t)) * Math.sin(t + loopOffset + secondaryTimeFactor);
          positions[k + 2] = tubeRadius * Math.sin(t) + waveOffset;
          color.setHSL(((ratio + Math.sin(t + time * 0.5)) * 0.5 * colorGradient) % 1, 1, 0.5);
          colors[k] = color.r;
          colors[k + 1] = color.g;
          colors[k + 2] = color.b;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }

    function fit() {
      // Frame the outermost loop (plus its wave) inside the shorter side of the stage.
      const reach = cfg.outerRadius * 1.55;
      const halfV = Math.tan(THREE.MathUtils.degToRad(37.5));
      camera.position.z = reach / (halfV * Math.min(1, aspect));
    }

    const loop = artLoop(host, {
      onResize(w, h, dpr) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        aspect = w / h;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        fit();
      },
      frame(_t, dt) {
        time += cfg.waveSpeed * dt * 60;
        update();
        line.rotation.y += cfg.rotationSpeed * dt * 60;
        line.rotation.x = Math.sin(time * 0.2) * 0.1;
        camera.position.y = Math.sin(time * 0.1) * 0.5;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      },
    });

    const onTap = () => {
      preset = (preset + 1) % PRESETS.length;
      cfg = { ...BASE, ...PRESETS[preset] };
      fit();
      presetCb.current?.(preset);
      loop.redraw();
    };
    canvas.addEventListener("click", onTap);

    return () => {
      loop.stop();
      canvas.removeEventListener("click", onTap);
      geometry.dispose();
      (line.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 bg-black" />;
}
