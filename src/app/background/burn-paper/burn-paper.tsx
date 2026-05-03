"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"

// Phase 0 — Scene foundation
// Task 0.1: WebGLRenderer (alpha:true, low toneMappingExposure), OrthographicCamera
// Task 0.2: PlaneGeometry(2,2,1,1) fills NDC exactly; UV origin bottom-left (0,0),
//           top-left (0,1). Burn origin in Phase 2 will default to UV (0,1) = top-left corner.

export default function BurnPaper() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current!

    // ── Task 0.1 · Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    // Low exposure: flame emits its own light, bright pixels should feel hot not blown-out
    renderer.toneMappingExposure = 0.75
    // Limit DPR on mobile to avoid fillrate stalls
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    // OrthographicCamera: frustum exactly (-1,1,1,-1) matches PlaneGeometry(2,2) in NDC
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1

    const scene = new THREE.Scene()

    // ── Task 0.2 · Plane geometry ─────────────────────────────────────────────
    // Segments 1×1 for now. Phase 4 will subdivide for vertex curl deformation.
    // UV layout (Three.js default for PlaneGeometry):
    //   bottom-left (0,0) · bottom-right (1,0) · top-left (0,1) · top-right (1,1)
    // → burn origin uOrigin = vec2(0.0, 1.0) maps to top-left corner in screen space
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1)

    // Placeholder material — replaced by ShaderMaterial in Phase 2
    const material = new THREE.MeshBasicMaterial({
      color: 0xfff8f0, // warm paper white
      side: THREE.DoubleSide,
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

    // Resize: only renderer size needs updating; ortho camera frustum is NDC-fixed
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
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1410" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
}
