"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { generateFBMTexture } from "./noise"

// ── Phase 0: scene foundation
// ── Phase 1: FBM DataTexture
// ── Phase 2: full burn ShaderMaterial (static threshold)
// ── Phase 3: burn animation control + interaction
//     Task 3.1: threshold linear-with-easing progression; stops at 1+edgeWidth
//     Task 3.2: click → reset threshold=0 + set uOrigin to click UV
//     Task 3.3: shader supports 2 origins; second click during burn adds uOrigin2

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG_BURN = /* glsl */`
  precision highp float;

  uniform sampler2D uNoise;
  uniform float uThreshold;
  uniform float uEdgeWidth;
  uniform float uTime;
  uniform vec2  uOrigin;   // primary ignition point (UV space)
  uniform vec2  uOrigin2;  // secondary ignition point (Task 3.3)

  varying vec2 vUv;

  void main() {
    // Task 2.2 / 3.3: distance from nearest ignition point (multi-origin)
    const float K     = 0.4;
    const float MAX_D = 1.4142;
    float d1 = distance(vUv, uOrigin);
    float d2 = distance(vUv, uOrigin2);
    float d  = min(d1, d2);
    float n  = texture2D(uNoise, vUv).r;
    float effectiveNoise = (n + d * K) / (1.0 + K * MAX_D);

    float lo = uThreshold - uEdgeWidth;
    float hi = uThreshold;

    if (effectiveNoise < lo) {
      discard;

    } else if (effectiveNoise <= hi) {
      float t = clamp((effectiveNoise - lo) / max(uEdgeWidth, 0.001), 0.0, 1.0);

      // Flicker (Task 2.4)
      float flicker = texture2D(uNoise, vUv * 7.0 + vec2(uTime * 0.35, uTime * 0.18)).r;
      t = clamp(t + (flicker - 0.5) * 0.22, 0.0, 1.0);

      // 4-segment colour gradient (Task 2.3)
      vec3 col;
      if (t < 0.25) {
        col = mix(vec3(0.02, 0.010, 0.010), vec3(0.15, 0.030, 0.010), t / 0.25);
      } else if (t < 0.60) {
        col = mix(vec3(0.15, 0.030, 0.010), vec3(0.90, 0.250, 0.020), (t - 0.25) / 0.35);
      } else if (t < 0.85) {
        col = mix(vec3(0.90, 0.250, 0.020), vec3(1.00, 0.550, 0.050), (t - 0.60) / 0.25);
      } else {
        col = mix(vec3(1.00, 0.550, 0.050), vec3(1.00, 0.920, 0.400), (t - 0.85) / 0.15);
      }

      // Fake HDR glow (Task 2.5)
      col *= mix(1.0, 3.5, smoothstep(0.25, 1.0, t));

      gl_FragColor = vec4(col, 1.0);

    } else {
      gl_FragColor = vec4(1.000, 0.988, 0.960, 1.0);
    }
  }
`

type BurnState = "burning" | "done"

export default function BurnPaper() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState<string>("click anywhere to ignite")

  useEffect(() => {
    const mount = mountRef.current!

    // ── Phase 0 · Renderer ────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.75
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1
    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1)

    // ── Phase 1 · FBM DataTexture ─────────────────────────────────────────────
    const NOISE_SIZE = 512
    const noiseData = generateFBMTexture(NOISE_SIZE, 5, 3.5)
    const noiseTexture = new THREE.DataTexture(
      noiseData, NOISE_SIZE, NOISE_SIZE,
      THREE.RedFormat, THREE.FloatType,
    )
    noiseTexture.wrapS = THREE.RepeatWrapping
    noiseTexture.wrapT = THREE.RepeatWrapping
    noiseTexture.minFilter = THREE.LinearMipmapLinearFilter
    noiseTexture.magFilter = THREE.LinearFilter
    noiseTexture.generateMipmaps = true
    noiseTexture.needsUpdate = true

    // ── Phase 2 · ShaderMaterial ──────────────────────────────────────────────
    const EDGE_WIDTH = 0.06
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uNoise:     { value: noiseTexture },
        uThreshold: { value: 0.0 },                         // starts at 0 (no burn)
        uEdgeWidth: { value: EDGE_WIDTH },
        uTime:      { value: 0.0 },
        uOrigin:    { value: new THREE.Vector2(0.0, 1.0) }, // top-left
        uOrigin2:   { value: new THREE.Vector2(0.0, 1.0) }, // same as origin until 2nd click
      },
      vertexShader:   VERT,
      fragmentShader: FRAG_BURN,
      transparent:    true,
      side:           THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Phase 3 · Burn state ──────────────────────────────────────────────────
    let burnState: BurnState = "done"  // starts paused; first click triggers
    let prevSec = 0

    // Task 3.2: map pointer position to UV
    function pointerToUV(e: PointerEvent): THREE.Vector2 {
      const rect = mount.getBoundingClientRect()
      const u = (e.clientX - rect.left) / rect.width
      const v = 1.0 - (e.clientY - rect.top) / rect.height
      return new THREE.Vector2(u, v)
    }

    function onPointerDown(e: PointerEvent) {
      const uv = pointerToUV(e)
      if (burnState === "done") {
        // Task 3.2: reset + ignite from click position
        material.uniforms.uThreshold.value = 0
        material.uniforms.uOrigin.value.copy(uv)
        material.uniforms.uOrigin2.value.copy(uv)
        burnState = "burning"
        setHint("click again to add a second fire")
      } else {
        // Task 3.3: add second ignition point during active burn
        material.uniforms.uOrigin2.value.copy(uv)
        setHint("")
      }
    }
    mount.addEventListener("pointerdown", onPointerDown)

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId: number
    function animate(ms: number) {
      rafId = requestAnimationFrame(animate)
      const sec = ms * 0.001
      const delta = Math.min(sec - prevSec, 0.1) // cap at 100 ms (tab-switch safety)
      prevSec = sec

      material.uniforms.uTime.value = sec

      // Task 3.1: threshold progression with gentle sinusoidal speed variation
      if (burnState === "burning") {
        const speed = 0.025 * (1 + 0.2 * Math.sin(sec * 0.7))
        const next = material.uniforms.uThreshold.value + speed * delta
        if (next >= 1.0 + EDGE_WIDTH) {
          material.uniforms.uThreshold.value = 1.0 + EDGE_WIDTH
          burnState = "done"
          setHint("click to ignite again")
        } else {
          material.uniforms.uThreshold.value = next
        }
      }

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    function onResize() {
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onResize)
      mount.removeEventListener("pointerdown", onPointerDown)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      noiseTexture.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1410", position: "relative", cursor: "crosshair" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {hint && (
        <p style={{
          position: "absolute", bottom: 24, left: 0, right: 0,
          textAlign: "center", fontFamily: "system-ui, sans-serif",
          fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(255,220,150,0.55)", pointerEvents: "none",
        }}>
          {hint}
        </p>
      )}
    </div>
  )
}
