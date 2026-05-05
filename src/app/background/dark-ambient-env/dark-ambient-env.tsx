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

const FRAG = /* glsl */`
  precision highp float;

  uniform float uTime;
  uniform vec2  uMouse;   // cursor in UV [0,1]
  uniform float uAspect;  // width / height
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

    // --- cursor light (phase 2) ---
    // Aspect-correct both pixel and cursor UV so the falloff is circular
    vec2 pixelA = vec2(vUv.x * uAspect, vUv.y);
    vec2 mouseA = vec2(uMouse.x * uAspect, uMouse.y);
    float d = distance(pixelA, mouseA);

    float radius = 0.38 * uAspect; // keep apparent size consistent across resolutions
    float light  = smoothstep(radius, 0.0, d);

    // Warm candlelight colour; additive blend onto stone surface
    vec3 lightCol = vec3(1.0, 0.52, 0.12);
    col += lightCol * light * 0.22;

    // Clamp: max illuminated luminance stays dim — "candle in dark", not floodlight
    col = min(col, vec3(0.28, 0.18, 0.08));

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

    const geometry = new THREE.PlaneGeometry(2, 2)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime:   { value: 0 },
        uMouse:  { value: new THREE.Vector2(0.5, 0.5) }, // start at center
        uAspect: { value: mount.clientWidth / mount.clientHeight },
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
    mount.addEventListener("pointermove", onPointerMove)

    let rafId: number
    function animate(ms: number) {
      rafId = requestAnimationFrame(animate)
      material.uniforms.uTime.value = ms * 0.001
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
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />
}
