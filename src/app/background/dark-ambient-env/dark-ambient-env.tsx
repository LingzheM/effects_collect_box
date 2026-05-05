"use client"

import { useRef, useEffect } from "react"
import * as THREE from "three"

const VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Max simultaneous click pulses tracked on CPU; array size must match GLSL constant
const MAX_PULSES = 4

const FRAG = /* glsl */`
  precision highp float;

  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uAspect;

  // Pulse ring: [x, y] = UV origin, z = birth time (-1 = inactive)
  uniform vec3  uPulses[4];

  varying vec2  vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),               hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // --- base texture (phase 1) ---
    vec2 uv = vUv + vec2(uTime * 0.008, uTime * 0.005);
    float n = fbm(uv * 5.0);
    float lum = 0.02 + n * 0.06;
    vec3 col = vec3(lum * 0.82, lum * 0.88, lum);

    // --- cursor light with breathing radius (phase 2 + 3) ---
    vec2 pixelA = vec2(vUv.x * uAspect, vUv.y);
    vec2 mouseA = vec2(uMouse.x * uAspect, uMouse.y);
    float d = distance(pixelA, mouseA);

    // Radius breathes slowly: base ± 8 %
    float radius = (0.38 + 0.03 * sin(uTime * 0.55)) * uAspect;
    float light  = smoothstep(radius, 0.0, d);

    vec3 lightCol = vec3(1.0, 0.52, 0.12);
    col += lightCol * light * 0.22;
    col = min(col, vec3(0.28, 0.18, 0.08));

    // --- click pulse rings (phase 3) ---
    for (int i = 0; i < 4; i++) {
      float birthTime = uPulses[i].z;
      if (birthTime < 0.0) continue;

      float age      = uTime - birthTime;
      float ringR    = age * 0.45 * uAspect;     // expanding radius (aspect-corrected)
      vec2  pulseA   = vec2(uPulses[i].x * uAspect, uPulses[i].y);
      float ringDist = abs(distance(pixelA, pulseA) - ringR);

      float ring = smoothstep(0.018, 0.0, ringDist);
      float fade = smoothstep(2.2, 0.0, age);
      col += vec3(0.18, 0.11, 0.04) * ring * fade;
    }

    // --- vignette (phase 1) ---
    float vign = smoothstep(0.45, 0.95, length(vUv - 0.5) * 1.6);
    col *= 1.0 - vign * 0.65;

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function DarkAmbientEnv() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current!

    const renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 1
    const scene = new THREE.Scene()

    // Pulse slots: each is vec3(uvX, uvY, birthTime). birthTime = -1 means inactive.
    const pulseData = Array.from({ length: MAX_PULSES }, () => new THREE.Vector3(0, 0, -1))
    let pulseSlot = 0

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0 },
        uMouse:  { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: mount.clientWidth / mount.clientHeight },
        uPulses: { value: pulseData },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    })
    scene.add(new THREE.Mesh(geometry, material))

    function onPointerMove(e: PointerEvent) {
      const rect = mount.getBoundingClientRect()
      material.uniforms.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      )
    }

    function onPointerDown(e: PointerEvent) {
      const rect = mount.getBoundingClientRect()
      const u = (e.clientX - rect.left) / rect.width
      const v = 1.0 - (e.clientY - rect.top) / rect.height
      const t = material.uniforms.uTime.value
      // Write into the next slot (round-robin), overwriting the oldest pulse
      pulseData[pulseSlot % MAX_PULSES].set(u, v, t)
      pulseSlot++
    }

    mount.addEventListener("pointermove", onPointerMove)
    mount.addEventListener("pointerdown", onPointerDown)

    let rafId: number
    function animate(ms: number) {
      rafId = requestAnimationFrame(animate)
      const t = ms * 0.001
      material.uniforms.uTime.value = t

      // Expire pulses older than 2.5 s so slots can be reused
      for (const p of pulseData) {
        if (p.z >= 0 && t - p.z > 2.5) p.z = -1
      }

      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(animate)

    function onResize() {
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      material.uniforms.uAspect.value = mount.clientWidth / mount.clientHeight
    }
    window.addEventListener("resize", onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onResize)
      mount.removeEventListener("pointermove", onPointerMove)
      mount.removeEventListener("pointerdown", onPointerDown)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh", cursor: "crosshair" }} />
}
