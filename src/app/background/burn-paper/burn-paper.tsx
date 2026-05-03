"use client"

import { useRef, useEffect, useState } from "react"
import * as THREE from "three"
import { generateFBMTexture } from "./noise"
import { ParticleSystem } from "./particles"

// ── Phase 0: scene foundation
// ── Phase 1: FBM DataTexture
// ── Phase 2: full burn ShaderMaterial
// ── Phase 3: animation + interaction
// ── Phase 4: paper visual enhancement
// ── Phase 5: smoke + ember particle system
//     Task 5.1: smoke from char edge — upward drift, Gaussian dots, dark gray→transparent
//     Task 5.2: embers from fire band — fast ejection, gravity, orange→black, shrink
// ── Phase 6: performance + debug
//     Task 6.1: mobile uses 256² noise; 512² on desktop
//     Task 6.2: ?debug=noise / ?debug=threshold URL params; FPS+threshold overlay
//     Task 6.3: FloatType DataTexture falls back to UnsignedByteType when unavailable

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

// Task 6.2: debug shader — pure noise grayscale (?debug=noise)
const FRAG_DEBUG_NOISE = /* glsl */`
  precision highp float;
  uniform sampler2D uNoise;
  varying vec2 vUv;
  void main() {
    float n = texture2D(uNoise, vUv).r;
    gl_FragColor = vec4(n, n, n, 1.0);
  }
`

// Task 6.2: debug shader — threshold heatmap (?debug=threshold)
// blue=burned · red/yellow=fire front · white=unburned
const FRAG_DEBUG_THRESHOLD = /* glsl */`
  precision highp float;
  uniform sampler2D uNoise;
  uniform float uThreshold;
  uniform float uEdgeWidth;
  uniform vec2  uOrigin;
  uniform vec2  uOrigin2;
  varying vec2 vUv;
  void main() {
    const float K = 0.4, MAX_D = 1.4142;
    float d = min(distance(vUv, uOrigin), distance(vUv, uOrigin2));
    float n = texture2D(uNoise, vUv).r;
    float en = (n + d * K) / (1.0 + K * MAX_D);
    vec3 col;
    if (en < uThreshold - uEdgeWidth) {
      col = vec3(0.10, 0.10, 0.70);                             // blue = burned
    } else if (en <= uThreshold) {
      float t = (en - (uThreshold - uEdgeWidth)) / uEdgeWidth;
      col = mix(vec3(0.80, 0.10, 0.10), vec3(1.0, 0.85, 0.0), t); // red→yellow = front
    } else {
      col = vec3(1.0, 1.0, 1.0);                                // white = unburned
    }
    gl_FragColor = vec4(col, 1.0);
  }
`

type BurnState = "burning" | "done"

export default function BurnPaper() {
  const mountRef = useRef<HTMLDivElement>(null)
  const [hint, setHint]           = useState<string>("click anywhere to ignite")
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    const mount = mountRef.current!

    // ── Task 6.2: read ?debug= URL param ─────────────────────────────────────
    const debugMode = new URLSearchParams(window.location.search).get("debug") ?? ""

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

    // ── Phase 0 · Plane geometry ──────────────────────────────────────────────
    // Debug modes use 1×1 segments (no curl needed for visualisation)
    const segments = debugMode ? 1 : 128
    const geometry = new THREE.PlaneGeometry(2, 2, segments, segments)

    // ── Task 6.3: FloatType capability check ──────────────────────────────────
    // WebGL2 supports R32F natively; WebGL1 requires OES_texture_float extension
    const caps = renderer.capabilities
    const supportsFloat = caps.isWebGL2 || renderer.extensions.get("OES_texture_float") !== null

    // ── Task 6.1: mobile → 256² noise; desktop → 512² ─────────────────────────
    const isMobile = window.innerWidth < 768 || window.devicePixelRatio > 1.5
    const NOISE_SIZE = isMobile ? 256 : 512

    // ── Phase 1 · FBM DataTexture ─────────────────────────────────────────────
    const noiseData = supportsFloat
      ? generateFBMTexture(NOISE_SIZE, 5, 3.5)
      : null  // UnsignedByte path uses scaled Uint8Array below

    let texData: Float32Array | Uint8Array
    let texType: typeof THREE.FloatType | typeof THREE.UnsignedByteType
    if (supportsFloat && noiseData) {
      texData = noiseData
      texType = THREE.FloatType
    } else {
      // Fallback: generate FBM then quantise to Uint8 [0,255] (Task 6.3)
      const f32 = generateFBMTexture(NOISE_SIZE, 5, 3.5)
      texData = new Uint8Array(f32.length)
      for (let i = 0; i < f32.length; i++) texData[i] = Math.round(f32[i] * 255)
      texType = THREE.UnsignedByteType
    }

    const noiseTexture = new THREE.DataTexture(texData, NOISE_SIZE, NOISE_SIZE, THREE.RedFormat, texType)
    noiseTexture.wrapS = THREE.RepeatWrapping
    noiseTexture.wrapT = THREE.RepeatWrapping
    noiseTexture.minFilter = THREE.LinearMipmapLinearFilter
    noiseTexture.magFilter = THREE.LinearFilter
    noiseTexture.generateMipmaps = true
    noiseTexture.needsUpdate = true

    // ── Task 4.1 · Paper grain texture ────────────────────────────────────────
    const paperTexture = createPaperTexture(512)

    // ── Phase 2 · ShaderMaterial ──────────────────────────────────────────────
    // Task 6.2: debug modes bypass FRAG_BURN with simpler diagnostic shaders
    const EDGE_WIDTH = 0.06
    const fragShader = debugMode === "noise"     ? FRAG_DEBUG_NOISE
                     : debugMode === "threshold" ? FRAG_DEBUG_THRESHOLD
                     : FRAG_BURN
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uNoise:     { value: noiseTexture },
        uPaperTex:  { value: paperTexture },
        uThreshold: { value: debugMode ? 0.45 : 0.0 }, // static preview in debug
        uEdgeWidth: { value: EDGE_WIDTH },
        uTime:      { value: 0.0 },
        uOrigin:    { value: new THREE.Vector2(0.0, 1.0) },
        uOrigin2:   { value: new THREE.Vector2(0.0, 1.0) },
      },
      vertexShader:        VERT,
      fragmentShader:      fragShader,
      transparent:         !debugMode,
      side:                THREE.DoubleSide,
      polygonOffset:       true,
      polygonOffsetFactor: -1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Phase 5 · Particle system ─────────────────────────────────────────────
    const particles = new ParticleSystem()
    scene.add(particles.points)

    // CPU-side noise lookup for particle spawn position validation
    // Mirrors the effectiveNoise formula from the fragment shader
    const K = 0.4, MAX_D = 1.4142
    // noiseData is non-null for Float32 path; for UnsignedByte we use texData (Uint8/255)
    const cpuNoise: Float32Array | Uint8Array = (noiseData as Float32Array | null) ?? (texData as Uint8Array)
    const cpuScale = supportsFloat ? 1 : 1 / 255
    function effectiveNoiseAt(u: number, v: number, o1: THREE.Vector2, o2: THREE.Vector2): number {
      const nx = Math.min((u * NOISE_SIZE) | 0, NOISE_SIZE - 1)
      const ny = Math.min((v * NOISE_SIZE) | 0, NOISE_SIZE - 1)
      const n = cpuNoise[ny * NOISE_SIZE + nx] * cpuScale
      const d1 = Math.sqrt((u - o1.x) ** 2 + (v - o1.y) ** 2)
      const d2 = Math.sqrt((u - o2.x) ** 2 + (v - o2.y) ** 2)
      return (n + Math.min(d1, d2) * K) / (1 + K * MAX_D)
    }

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
        particles.reset()
        burnState = "burning"
        setHint("click again to add a second fire")
      } else {
        material.uniforms.uOrigin2.value.copy(uv)
        setHint("")
      }
    }
    mount.addEventListener("pointerdown", onPointerDown)

    // ── Render loop ───────────────────────────────────────────────────────────
    const SMOKE_PER_S = 35  // smoke spawns/second during burn
    const EMBER_PER_S = 10  // ember spawns/second during burn
    let smokeAcc = 0, emberAcc = 0

    // Task 6.2: FPS rolling average (last 60 frames)
    const fpsBuf = new Float32Array(60)
    let fpsIdx = 0, fpsUpdateTimer = 0

    let rafId: number
    function animate(ms: number) {
      rafId = requestAnimationFrame(animate)
      const sec = ms * 0.001
      const delta = Math.min(sec - prevSec, 0.1)
      prevSec = sec

      material.uniforms.uTime.value = sec

      // FPS tracking (Task 6.2)
      if (delta > 0) {
        fpsBuf[fpsIdx % 60] = 1 / delta
        fpsIdx++
      }
      fpsUpdateTimer += delta
      if (debugMode && fpsUpdateTimer > 0.5) {
        fpsUpdateTimer = 0
        const avg = fpsBuf.reduce((s, v) => s + v, 0) / 60
        const thr = material.uniforms.uThreshold.value
        setDebugInfo(`FPS ${avg.toFixed(0)}  |  threshold ${thr.toFixed(3)}  |  noise ${NOISE_SIZE}²  |  ${supportsFloat ? "f32" : "u8"}`)
      }

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

        // Task 5.1 / 5.2: spawn particles along fire front
        const threshold = material.uniforms.uThreshold.value
        const o1 = material.uniforms.uOrigin.value as THREE.Vector2
        const o2 = material.uniforms.uOrigin2.value as THREE.Vector2

        smokeAcc += SMOKE_PER_S * delta
        emberAcc += EMBER_PER_S * delta

        // Each spawn attempt: random UV → check zone → spawn or discard
        const ATTEMPTS_PER_SPAWN = 12
        while (smokeAcc >= 1) {
          for (let a = 0; a < ATTEMPTS_PER_SPAWN; a++) {
            const u = Math.random(), v = Math.random()
            const en = effectiveNoiseAt(u, v, o1, o2)
            // Char zone: just behind the fire front (Task 5.1)
            if (en >= threshold - EDGE_WIDTH * 2.2 && en < threshold - EDGE_WIDTH * 0.5) {
              particles.spawnSmoke(u * 2 - 1, v * 2 - 1)
              break
            }
          }
          smokeAcc--
        }

        while (emberAcc >= 1) {
          for (let a = 0; a < ATTEMPTS_PER_SPAWN; a++) {
            const u = Math.random(), v = Math.random()
            const en = effectiveNoiseAt(u, v, o1, o2)
            // Fire band: active combustion zone (Task 5.2)
            if (en >= threshold - EDGE_WIDTH && en <= threshold + EDGE_WIDTH * 0.5) {
              particles.spawnEmber(u * 2 - 1, v * 2 - 1)
              break
            }
          }
          emberAcc--
        }
      }

      particles.update(delta)
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
      particles.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1410", position: "relative", cursor: "crosshair" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      {/* Task 6.2: debug info overlay (top-left, only visible in debug mode) */}
      {debugInfo && (
        <pre style={{
          position: "absolute", top: 12, left: 14,
          fontFamily: "monospace", fontSize: 11, lineHeight: 1.5,
          color: "rgba(120,220,120,0.85)", pointerEvents: "none",
          margin: 0, whiteSpace: "pre",
        }}>
          {debugInfo}
        </pre>
      )}

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
