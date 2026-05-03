// Phase 5: smoke + ember particle system
// Task 5.1: smoke — upward drift, Gaussian soft dots, dark-gray→transparent
// Task 5.2: embers — fast ejection, gravity, orange→black, shrink on landing
import * as THREE from "three"

const MAX_SMOKE  = 200
const MAX_EMBERS = 60
export const POOL_SIZE = MAX_SMOKE + MAX_EMBERS

// Particle vertex shader — custom size and per-vertex color/opacity
const VERT = /* glsl */`
  attribute vec3  aColor;
  attribute float aOpacity;
  attribute float aSize;
  varying vec4 vColor;

  void main() {
    vColor = vec4(aColor, aOpacity);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
  }
`

// Gaussian soft-circle via gl_PointCoord (Task 5.1 Step 4)
const FRAG = /* glsl */`
  varying vec4 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor.rgb, vColor.a * a);
    if (gl_FragColor.a < 0.01) discard;
  }
`

export class ParticleSystem {
  readonly points: THREE.Points

  // GPU-visible typed arrays (direct refs in BufferAttribute, no copy)
  private readonly pos:  Float32Array
  private readonly col:  Float32Array
  private readonly opac: Float32Array
  private readonly sz:   Float32Array

  // CPU-only state (not uploaded to GPU)
  private readonly vx:      Float32Array
  private readonly vy:      Float32Array
  private readonly life:    Float32Array  // 0 = fresh, 1 = dead
  private readonly decay:   Float32Array  // 1/lifetime
  private readonly ember:   Uint8Array    // 1 = ember, 0 = smoke
  private readonly baseSz:  Float32Array

  private nextSmoke = 0
  private nextEmber = MAX_SMOKE

  constructor() {
    this.pos    = new Float32Array(POOL_SIZE * 3)
    this.col    = new Float32Array(POOL_SIZE * 3)
    this.opac   = new Float32Array(POOL_SIZE)
    this.sz     = new Float32Array(POOL_SIZE)
    this.vx     = new Float32Array(POOL_SIZE)
    this.vy     = new Float32Array(POOL_SIZE)
    this.life   = new Float32Array(POOL_SIZE).fill(1) // all dead initially
    this.decay  = new Float32Array(POOL_SIZE)
    this.ember  = new Uint8Array(POOL_SIZE)
    this.baseSz = new Float32Array(POOL_SIZE)

    const geo     = new THREE.BufferGeometry()
    const posAttr  = new THREE.BufferAttribute(this.pos,  3)
    const colAttr  = new THREE.BufferAttribute(this.col,  3)
    const opacAttr = new THREE.BufferAttribute(this.opac, 1)
    const szAttr   = new THREE.BufferAttribute(this.sz,   1)
    posAttr .setUsage(THREE.DynamicDrawUsage)
    colAttr .setUsage(THREE.DynamicDrawUsage)
    opacAttr.setUsage(THREE.DynamicDrawUsage)
    szAttr  .setUsage(THREE.DynamicDrawUsage)
    geo.setAttribute("position", posAttr)
    geo.setAttribute("aColor",   colAttr)
    geo.setAttribute("aOpacity", opacAttr)
    geo.setAttribute("aSize",    szAttr)
    geo.setDrawRange(0, POOL_SIZE)

    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      depthWrite:     false,
      blending:       THREE.NormalBlending,
    })

    this.points = new THREE.Points(geo, mat)
  }

  // Task 5.1: spawn smoke from char edge (wx,wy in world space −1..1)
  spawnSmoke(wx: number, wy: number) {
    const i = this.nextSmoke
    this.nextSmoke = (this.nextSmoke + 1) % MAX_SMOKE

    const lifetime = 2.0 + Math.random() * 1.5
    this.pos[i * 3]     = wx + (Math.random() - 0.5) * 0.04
    this.pos[i * 3 + 1] = wy
    this.pos[i * 3 + 2] = 0.05
    this.vx[i]  = (Math.random() - 0.5) * 0.03
    this.vy[i]  = 0.04 + Math.random() * 0.05
    const g = 0.10 + Math.random() * 0.08
    this.col[i * 3] = g; this.col[i * 3 + 1] = g * 0.9; this.col[i * 3 + 2] = g * 0.85
    this.life[i]   = 0
    this.decay[i]  = 1 / lifetime
    this.ember[i]  = 0
    this.baseSz[i] = 10 + Math.random() * 12
    this.opac[i]   = 0
    this.sz[i]     = this.baseSz[i] * 0.5
  }

  // Task 5.2: spawn ember from fire band — fast, gravity, orange→black
  spawnEmber(wx: number, wy: number) {
    const i = MAX_SMOKE + (this.nextEmber % MAX_EMBERS)
    this.nextEmber++

    const speed = 0.08 + Math.random() * 0.22
    const spread = (Math.random() - 0.5) * 0.9  // mostly upward, some sideways
    this.pos[i * 3]     = wx
    this.pos[i * 3 + 1] = wy
    this.pos[i * 3 + 2] = 0.03
    this.vx[i]  = Math.sin(spread) * speed
    this.vy[i]  = Math.cos(spread) * speed
    this.col[i * 3] = 1.0; this.col[i * 3 + 1] = 0.4 + Math.random() * 0.25; this.col[i * 3 + 2] = 0
    this.life[i]   = 0
    this.decay[i]  = 1 / (0.5 + Math.random() * 0.8)
    this.ember[i]  = 1
    this.baseSz[i] = 3 + Math.random() * 4
    this.opac[i]   = 1
    this.sz[i]     = this.baseSz[i]
  }

  update(delta: number) {
    for (let i = 0; i < POOL_SIZE; i++) {
      if (this.life[i] >= 1) {
        this.opac[i] = 0
        this.sz[i]   = 0
        continue
      }
      this.life[i] = Math.min(this.life[i] + this.decay[i] * delta, 1)
      const t = this.life[i]

      this.pos[i * 3]     += this.vx[i] * delta
      this.pos[i * 3 + 1] += this.vy[i] * delta

      if (this.ember[i]) {
        // Gravity (Task 5.2 Step 2): vy += -9.8 * dt * 0.02
        this.vy[i] -= 9.8 * 0.02 * delta
        // Cool: red channel holds, green drops → ember goes from orange to dark red to black
        this.col[i * 3 + 1] = Math.max(0, 0.4 - t * 0.5)
        // Opacity: full for first half, then fast fade (Task 5.2 Step 3)
        this.opac[i] = t < 0.5 ? 1.0 : Math.max(0, (1 - t) / 0.5)
        // Shrink with age
        this.sz[i] = Math.max(0, this.baseSz[i] * (1 - t * 0.7))
      } else {
        // Smoke: bell-curve opacity (ramp up to 0.2, hold, fade to 0)
        this.opac[i] = t < 0.15
          ? (t / 0.15) * 0.55
          : Math.max(0, (1 - t) / 0.85 * 0.55)
        // Smoke grows as it rises and disperses
        this.sz[i] = this.baseSz[i] * (0.4 + t * 1.4)
      }
    }

    const geo = this.points.geometry
    ;(geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute("aColor")   as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute("aOpacity") as THREE.BufferAttribute).needsUpdate = true
    ;(geo.getAttribute("aSize")    as THREE.BufferAttribute).needsUpdate = true
  }

  reset() {
    this.life.fill(1)
    this.nextSmoke = 0
    this.nextEmber = MAX_SMOKE
  }

  dispose() {
    this.points.geometry.dispose()
    ;(this.points.material as THREE.ShaderMaterial).dispose()
  }
}
