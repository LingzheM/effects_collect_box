"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { generateFBMTexture } from "./noise"

// ── Phase 0: scene foundation (renderer, ortho camera, PlaneGeometry 2×2)
// ── Phase 1: FBM DataTexture (RedFormat / FloatType, 512²)
// ── Phase 2: full burn ShaderMaterial
//     Task 2.1: uniforms — uNoise, uThreshold, uEdgeWidth, uTime, uOrigin
//     Task 2.2: distance-field weighted sampling from uOrigin; k=0.4 directionality
//     Task 2.3: three-region fragment logic + 4-segment fire gradient
//     Task 2.4: high-freq flicker on color-t only (discard boundary stays crisp)
//     Task 2.5: fake HDR glow (emissive ×3.5 at hot front, ACES tone-mapping)

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Task 2.3 — fragment shader with all Phase 2 features
const FRAG_BURN = /* glsl */`
  precision highp float;

  uniform sampler2D uNoise;
  uniform float uThreshold;   // burn front [0,1] — static in Phase 2, animated in Phase 3
  uniform float uEdgeWidth;   // fire band width
  uniform float uTime;        // seconds — drives flicker animation (Task 2.4)
  uniform vec2  uOrigin;      // burn start in UV space (top-left = vec2(0,1))

  varying vec2 vUv;

  void main() {
    // Task 2.2: distance-weighted noise → directional spread from uOrigin
    // k=0.4: moderate pull; effectiveNoise normalised back to [0,1]
    // max UV diagonal from any corner = sqrt(2) ≈ 1.4142
    const float K       = 0.4;
    const float MAX_D   = 1.4142;
    float d             = distance(vUv, uOrigin);
    float n             = texture2D(uNoise, vUv).r;
    float effectiveNoise = (n + d * K) / (1.0 + K * MAX_D);

    float lo = uThreshold - uEdgeWidth;   // char / burned boundary
    float hi = uThreshold;                // fire front / unburned boundary

    if (effectiveNoise < lo) {
      // ── Burned: fully transparent ──────────────────────────────────────────
      discard;

    } else if (effectiveNoise <= hi) {
      // ── Fire front band ────────────────────────────────────────────────────
      // t: 0 = near char (cool), 1 = near unburned paper (hottest)
      float t = clamp((effectiveNoise - lo) / max(uEdgeWidth, 0.001), 0.0, 1.0);

      // Task 2.4: Flicker — high-freq noise shifts t (color only, not discard)
      // Use a different UV scale + time-offset so it animates independently
      float flicker = texture2D(uNoise, vUv * 7.0 + vec2(uTime * 0.35, uTime * 0.18)).r;
      t = clamp(t + (flicker - 0.5) * 0.22, 0.0, 1.0);

      // Task 2.3: 4-segment colour gradient
      //   [0.00, 0.25] black char      → dark brown-red
      //   [0.25, 0.60] dark brown-red  → orange-red
      //   [0.60, 0.85] orange-red      → bright orange
      //   [0.85, 1.00] bright orange   → hot yellow-white
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

      // Task 2.5: Fake HDR glow — emissive multiplier > 1 → ACES tone-map
      // creates bloom-like saturation on the hottest pixels (no post-pass needed)
      float emissive = mix(1.0, 3.5, smoothstep(0.25, 1.0, t));
      col *= emissive;

      gl_FragColor = vec4(col, 1.0);

    } else {
      // ── Unburned paper: warm white ─────────────────────────────────────────
      gl_FragColor = vec4(1.000, 0.988, 0.960, 1.0);
    }
  }
`

export default function BurnPaper() {
  const mountRef = useRef<HTMLDivElement>(null)

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

    // ── Phase 0 · Plane geometry ──────────────────────────────────────────────
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

    // ── Phase 2 · Burn ShaderMaterial ─────────────────────────────────────────
    // Task 2.1: uniform list
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uNoise:     { value: noiseTexture },
        uThreshold: { value: 0.45 },                        // static in Phase 2
        uEdgeWidth: { value: 0.06 },
        uTime:      { value: 0.0 },                         // updated per-frame for flicker
        uOrigin:    { value: new THREE.Vector2(0.0, 1.0) }, // top-left UV corner
      },
      vertexShader:   VERT,
      fragmentShader: FRAG_BURN,
      transparent:    true,  // required so discard regions show through
      side:           THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Render loop: update uTime for flicker ─────────────────────────────────
    let rafId: number
    function animate(t: number) {
      rafId = requestAnimationFrame(animate)
      material.uniforms.uTime.value = t * 0.001
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
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      noiseTexture.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1410" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
