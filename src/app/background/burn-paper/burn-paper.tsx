"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { generateFBMTexture } from "./noise"

// Phase 0: scene foundation (renderer, camera, plane geometry)
// Phase 1: FBM DataTexture + noise-verification shader
//   Task 1.1: FBM (5-octave Perlin) chosen for natural char-edge feel
//   Task 1.2: CPU pre-bake → DataTexture (RedFormat/FloatType, 512²)
//   Task 1.3: noise.ts implements fbm + generateFBMTexture with [0,1] remap
//   Task 1.4: verify noise by displaying it as grayscale via ShaderMaterial

// ── Verification shader (Phase 1) — replaced by full burn shader in Phase 2 ──
const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG_NOISE_DEBUG = /* glsl */`
  uniform sampler2D uNoise;
  varying vec2 vUv;
  void main() {
    float n = texture2D(uNoise, vUv).r;
    gl_FragColor = vec4(n, n, n, 1.0);
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
    // Segments 1×1; Phase 4 will raise to 128×128 for curl vertex deformation
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1)

    // ── Phase 1 · FBM DataTexture (Task 1.3) ─────────────────────────────────
    const NOISE_SIZE = 512
    const noiseData = generateFBMTexture(NOISE_SIZE, 5, 3.5)

    const noiseTexture = new THREE.DataTexture(
      noiseData,
      NOISE_SIZE,
      NOISE_SIZE,
      THREE.RedFormat,
      THREE.FloatType,
    )
    noiseTexture.wrapS = THREE.RepeatWrapping
    noiseTexture.wrapT = THREE.RepeatWrapping
    noiseTexture.minFilter = THREE.LinearMipmapLinearFilter
    noiseTexture.magFilter = THREE.LinearFilter
    noiseTexture.generateMipmaps = true
    noiseTexture.needsUpdate = true

    // ── Phase 1 · Noise verification shader (Task 1.4) ───────────────────────
    // Displays noise as grayscale to confirm continuous gradient coverage [0,1]
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uNoise: { value: noiseTexture },
      },
      vertexShader: VERT,
      fragmentShader: FRAG_NOISE_DEBUG,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // ── Render loop ───────────────────────────────────────────────────────────
    let rafId: number
    function animate() {
      rafId = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

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
