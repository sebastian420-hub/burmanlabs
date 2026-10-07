"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The index's hover preview: one textured plane that trails the cursor with a soft
 * lens bulge and an RGB split that scales with how fast the cursor moves.
 * Desktop only (mounted by WorkIndex when the pointer is fine and WebGL is allowed).
 * It is one fixed, pointer-transparent canvas for the whole page.
 */
export interface PreviewTarget {
  src: string;
  /** Anchor for keyboard focus: the preview sits beside this box instead of the cursor. */
  anchor?: { x: number; y: number };
}

const W = 340;
const H = 212;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uOpacity;
  uniform vec2 uVel;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 c = vUv - 0.5;
    float r2 = dot(c, c);
    // gentle barrel lens, stronger while moving
    vec2 uv = vUv + c * r2 * (0.18 + length(uVel) * 1.2);
    vec2 shift = uVel * 0.035;
    float rr = texture2D(uTex, uv + shift).r;
    float gg = texture2D(uTex, uv).g;
    float bb = texture2D(uTex, uv - shift).b;
    // rounded-rect mask with a soft edge
    vec2 q = abs(c) - vec2(0.5 - 0.035, 0.5 - 0.056);
    float d = length(max(q, 0.0)) - 0.035;
    float mask = 1.0 - smoothstep(-0.004, 0.004, d);
    vec3 col = vec3(rr, gg, bb);
    // lift the darks a touch (the screenshots are mostly black on a black page)
    col = col * 1.12 + 0.03;
    col *= 1.0 - r2 * 0.15;
    // hairline edge so the card reads against the page
    float edge = (1.0 - smoothstep(-0.006, 0.0, d)) * smoothstep(-0.012, -0.006, d);
    col = mix(col, vec3(0.95, 0.94, 0.91), edge * 0.55);
    gl_FragColor = vec4(col, mask * uOpacity);
  }
`;

export default function HoverPreview({ target }: { target: PreviewTarget | null }) {
  const hostRef = useRef<HTMLCanvasElement>(null);
  const live = useRef(target);
  useEffect(() => {
    live.current = target;
  }, [target]);

  useEffect(() => {
    const canvas = hostRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);
    const uniforms = {
      uTex: { value: null as THREE.Texture | null },
      uOpacity: { value: 0 },
      uVel: { value: new THREE.Vector2() },
      uTime: { value: 0 },
    };
    // The camera is y-down (screen space), which reverses winding: draw both sides.
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mat);
    scene.add(plane);

    const loader = new THREE.TextureLoader();
    const cache = new Map<string, THREE.Texture>();
    const texFor = (src: string) => {
      let t = cache.get(src);
      if (!t) {
        t = loader.load(src);
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.flipY = false; // the y-down camera already turns the plane over
        cache.set(src, t);
      }
      return t;
    };

    const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { x: mouse.x, y: mouse.y };
    const vel = new THREE.Vector2();
    let opacity = 0;
    let raf = 0;
    let currentSrc: string | null = null;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(innerWidth, innerHeight, false);
      camera.right = innerWidth;
      camera.bottom = innerHeight;
      camera.top = 0;
      camera.updateProjectionMatrix();
    };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    addEventListener("resize", resize);
    addEventListener("pointermove", onMove, { passive: true });
    resize();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const t = live.current;
      const want = t ? 1 : 0;
      if (t && t.src !== currentSrc) {
        currentSrc = t.src;
        uniforms.uTex.value = texFor(t.src);
      }
      // follow: cursor, or the keyboard anchor
      const tx = t?.anchor ? t.anchor.x : mouse.x + 28 + W / 2;
      const ty = t?.anchor ? t.anchor.y : mouse.y + 16;
      // keep it on screen
      const cx = Math.min(innerWidth - W / 2 - 12, Math.max(W / 2 + 12, tx));
      const cy = Math.min(innerHeight - H / 2 - 12, Math.max(H / 2 + 12, ty));
      const nx = pos.x + (cx - pos.x) * 0.16;
      const ny = pos.y + (cy - pos.y) * 0.16;
      vel.set((nx - pos.x) / 60, (ny - pos.y) / 60);
      pos.x = nx;
      pos.y = ny;
      opacity += (want - opacity) * (want ? 0.14 : 0.2);
      uniforms.uOpacity.value = opacity;
      uniforms.uVel.value.lerp(vel, 0.3);
      uniforms.uTime.value += 0.016;
      plane.position.set(pos.x, pos.y, 0);
      plane.scale.setScalar(0.92 + 0.08 * opacity);
      plane.rotation.z = -uniforms.uVel.value.x * 0.12;
      if (opacity > 0.005 || want) renderer.render(scene, camera);
      else renderer.clear();
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      cache.forEach((t) => t.dispose());
      plane.geometry.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 h-full w-full"
      style={{ mixBlendMode: "normal" }}
    />
  );
}
