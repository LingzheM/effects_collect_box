"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { generateFBMTexture } from "./noise"

// ── Phase 0: scene foundation
// ── Phase 1: FBM DataTexture
// ── Phase 2: full burn ShaderMaterial
// ── Phase 3: animation + interaction
// ── Phase 4: paper visual enhancement
//     Task 4.1: Canvas-generated paper grain → uPaperTex; unburned region
//               samples the texture instead of flat warm-white
//     Task 4.2: PlaneGeometry subdivided to 128×128; vertex shader samples
//               uNoise to apply Y curl at the burn front (paper lifting edge);
//               polygonOffset avoids z-fighting with future smoke particles

// ── Task 4.1: Canvas paper grain texture ─────────────────────────────────────
// Generates a 512² warm-white base with fine random-dot grain, mimicking
// actual paper surface texture.
function createPaperTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!

  // Warm paper base
  ctx.fillStyle = "#fff8f0"
  ctx.fillRect(0, 0, size, size)

  // Fine grain: sparse semi-transparent brown dots
  for (let i = 0; i < size * size * 0.25; i++) {
    const x = (Math.random() * size) | 0
    const y = (Math.random() * size) | 0
    const a = (Math.random() * 0.06 + 0.01).toFixed(3)
    ctx.fillStyle = `rgba(90,65,40,${a})`
    ctx.fillRect(x, y, 1, 1)
  }

  // Very subtle longer fibre streaks (horizontal)
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() * size) | 0
    const y = (Math.random() * size) | 0
    const len = (Math.random() * 6 + 2) | 0
    const a = (Math.random() * 0.03 + 0.005).toFixed(3)
    ctx.fillStyle = `rgba(80,55,30,${a})`
    ctx.fillRect(x, y, len, 1)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

// ── Shaders ───────────────────────────────────────────────────────────────────

// Task 4.2: vertex shader samples uNoise to compute effectiveNoise at each
// vertex, then lifts Y near the burn front (paper-curl illusion).
const VERT = /* glsl */`
  uniform sampler2D uNoise;
  uniform float uThreshold;
  uniform float uEdgeWidth;
  uniform vec2  uOrigin;
  uniform vec2  uOrigin2;

  varying vec2 vUv;

  void main() {
    vUv = uv;

    // Replicate effectiveNoise from fragment shader (same formula)
    const float K     = 0.4;
    const float MAX_D = 1.4142;
    float d1 = distance(uv, uOrigin);
    float d2 = distance(uv, uOrigin2);
    float d  = min(d1, d2);
    float n  = texture2D(uNoise, uv).r;
    float effectiveNoise = (n + d * K) / (1.0 + K * MAX_D);

    // Curl zone: a band just before the fire front (pre-burning, paper lifts)
    // Range: [threshold - 2.5*edgeWidth, threshold + edgeWidth]
    float curlLo  = uThreshold - uEdgeWidth * 2.5;
    float curlHi  = uThreshold + uEdgeWidth;
    float curlAmt = 0.0;
    if (effectiveNoise >= curlLo && effectiveNoise <= curlHi) {
      float t = (effectiveNoise - curlLo) / (curlHi - curlLo);
      // Bell-curve lift: peaks at t ≈ 0.6 (just inside fire front)
      curlAmt = sin(t * 3.14159) * 0.055;
    }

    vec3 pos = position;
    pos.y += curlAmt;  // paper lifts upward along the burn edge

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG_BURN = /* glsl */`
  precision highp float;

  uniform sampler2D uNoise;
  uniform sampler2D uPaperTex;   // Task 4.1: paper grain texture
  uniform float uThreshold;
  uniform float uEdgeWidth;
  uniform float uTime;
  uniform vec2  uOrigin;
  uniform vec2  uOrigin2;

  varying vec2 vUv;

  void main() {
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

      // Flicker
      float flicker = texture2D(uNoise, vUv * 7.0 + vec2(uTime * 0.35, uTime * 0.18)).r;
      t = clamp(t + (flicker - 0.5) * 0.22, 0.0, 1.0);

      // 4-segment colour gradient
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

      // Fake HDR glow
      col *= mix(1.0, 3.5, smoothstep(0.25, 1.0, t));

      gl_FragColor = vec4(col, 1.0);

    } else {
      // Task 4.1: sample paper grain texture for unburned region
      gl_FragColor = texture2D(uPaperTex, vUv);
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

    // ── Phase 0 · Plane geometry — subdivided for curl (Task 4.2) ─────────────
    const geometry = new THREE.PlaneGeometry(2, 2, 128, 128)

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

    // ── Task 4.1 · Paper grain texture ────────────────────────────────────────
    const paperTexture = createPaperTexture(512)

    // ── Phase 2 · ShaderMaterial ──────────────────────────────────────────────
    const EDGE_WIDTH = 0.06
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uNoise:     { value: noiseTexture },
        uPaperTex:  { value: paperTexture },
        uThreshold: { value: 0.0 },
        uEdgeWidth: { value: EDGE_WIDTH },
        uTime:      { value: 0.0 },
        uOrigin:    { value: new THREE.Vector2(0.0, 1.0) },
        uOrigin2:   { value: new THREE.Vector2(0.0, 1.0) },
      },
      vertexShader:        VERT,
      fragmentShader:      FRAG_BURN,
      transparent:         true,
      side:                THREE.DoubleSide,
      // Task 4.2: prevent z-fighting when smoke particles are added in Phase 5
      polygonOffset:       true,
      polygonOffsetFactor: -1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Phase 3 · Burn state ──────────────────────────────────────────────────
    let burnState: BurnState = "done"
    let prevSec = 0

    function pointerToUV(e: PointerEvent): THREE.Vector2 {
      const rect = mount.getBoundingClientRect()
      return new THREE.Vector2(
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      )
    }

    function onPointerDown(e: PointerEvent) {
      const uv = pointerToUV(e)
      if (burnState === "done") {
        material.uniforms.uThreshold.value = 0
        material.uniforms.uOrigin.value.copy(uv)
        material.uniforms.uOrigin2.value.copy(uv)
        burnState = "burning"
        setHint("click again to add a second fire")
      } else {
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
      const delta = Math.min(sec - prevSec, 0.1)
      prevSec = sec

      material.uniforms.uTime.value = sec

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
      paperTexture.dispose()
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
