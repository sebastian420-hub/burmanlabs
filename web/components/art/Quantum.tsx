"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { artLoop } from "@/lib/artLoop";

/**
 * "Quantum" — port of Portfolio/atomsketch.js (p5.js WEBGL) to three.js.
 * An outer ring and two inner rings flicker through random reds around a pink core;
 * the inner rings grow out from the centre and collapse again. Holding the pointer
 * down plays the original "high" state, letting them grow much further.
 *
 * p5 units are pixels; here 100 px = 1 unit, with p5's default 60° camera.
 * The original snaps every inner ring and the core to a random angle each frame,
 * which strobes; this keeps the jitter but smooths it (photosensitivity).
 */
export default function Quantum() {
  const hostRef = useRef<HTMLDivElement>(null);

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
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:pointer";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 5.2);

    const red = () => new THREE.LineBasicMaterial({ color: 0xff0000 });
    const ringGeo = new THREE.TorusGeometry(1, 0.05, 16, 24);
    const ringWire = new THREE.WireframeGeometry(ringGeo);

    // Outer ring: dark blue fill (0,0,100) under a flickering red wireframe, as in p5.
    const outer = new THREE.Group();
    const outerFill = new THREE.Mesh(new THREE.TorusGeometry(2, 0.05, 16, 24), new THREE.MeshBasicMaterial({ color: 0x000064 }));
    const outerWire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.TorusGeometry(2, 0.05, 16, 24)), red());
    outer.add(outerFill, outerWire);
    scene.add(outer);

    const inner = [0, 1].map(() => {
      const g = new THREE.Group();
      const wire = new THREE.LineSegments(ringWire, red());
      g.add(wire);
      scene.add(g);
      return { g, wire };
    });

    const core = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.5, 16, 24),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(255 / 255, 30 / 255, 80 / 255) }),
    );
    scene.add(core);

    // Original state machine, counted in 60 fps "ticks".
    let ticks = 0;
    let anime = 0;
    let a = 0;
    let flip = false;
    let high = false;
    let spin = 0;
    let spinV = 1;
    const jx = [0, 0];

    const flicker = (m: THREE.LineBasicMaterial) =>
      m.color.setRGB(Math.random(), Math.random() * 0.1, Math.random() * 0.1);

    const loop = artLoop(host, {
      maxDpr: 2,
      onResize(w, h, dpr) {
        renderer.setPixelRatio(dpr);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Keep the 2-unit ring inside narrow portrait screens.
        camera.position.z = w / h < 0.85 ? 5.2 / (w / h / 0.85) : 5.2;
        camera.updateProjectionMatrix();
      },
      frame(_t, dt) {
        const steps = Math.max(1, Math.round(dt * 60));
        for (let s = 0; s < steps; s++) {
          ticks++;
          anime++;
          const state = high ? 500 : 300;
          if (anime > 150) {
            flip = !flip;
            if (!flip) a++;
            if (anime > state) {
              a = 0;
              anime = 0;
            }
          }
          spin += spinV * 0.0005;
          spinV = Math.min(spinV + 1, 120);
        }

        outer.rotation.set(0, ticks * 0.04, spin);
        flicker(outerWire.material as THREE.LineBasicMaterial);

        inner.forEach(({ g, wire }, i) => {
          jx[i] += (Math.random() - 0.5) * 0.25;
          jx[i] *= 0.9;
          g.visible = a > 0;
          g.scale.set(a / 100, a / 100, 1);
          g.rotation.set(ticks * (0.015 + i * 0.01) + jx[i], ticks * 0.02, ticks * 0.004);
          flicker(wire.material as THREE.LineBasicMaterial);
        });

        core.rotation.set(ticks * 0.031, ticks * 0.047, ticks * 0.06);
        renderer.render(scene, camera);
      },
    });

    const down = () => {
      high = true;
      loop.redraw();
    };
    const up = () => (high = false);
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);

    return () => {
      loop.stop();
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        (m.material as THREE.Material | undefined)?.dispose?.();
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 bg-black" />;
}
