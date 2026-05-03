// CPU-side FBM (Fractional Brownian Motion) noise — Phase 1
//
// Decision rationale (Task 1.1 / 1.2):
//   • Noise type: Classic Perlin 2D + FBM (5 octaves) — natural char-edge feel
//   • Location: CPU → DataTexture (pre-baked) — FBM at 512² is too heavy for
//     per-fragment realtime on low-end devices; texture sampling is faster & mipmappable

// ── Permutation table (deterministic, seed=42) ───────────────────────────────
const perm = new Uint8Array(512)
;(() => {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  // LCG shuffle for a fixed, reproducible table
  let s = 42
  for (let i = 255; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]
})()

// Ken Perlin's improved fade: 6t⁵ − 15t⁴ + 10t³
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

// 2D gradient contribution from hashed lattice point
function grad(h: number, x: number, y: number): number {
  const u = (h & 2) === 0 ? x : y
  const v = (h & 2) === 0 ? y : x
  return ((h & 1) ? -u : u) + ((h & 4) ? -v : v)
}

function perlin2D(x: number, y: number): number {
  const ix = Math.floor(x) & 255
  const iy = Math.floor(y) & 255
  const fx = x - Math.floor(x)
  const fy = y - Math.floor(y)
  const ux = fade(fx)
  const uy = fade(fy)
  const aa = perm[perm[ix] + iy]
  const ab = perm[perm[ix] + iy + 1]
  const ba = perm[perm[ix + 1] + iy]
  const bb = perm[perm[ix + 1] + iy + 1]
  return lerp(
    lerp(grad(aa, fx, fy),     grad(ba, fx - 1, fy),     ux),
    lerp(grad(ab, fx, fy - 1), grad(bb, fx - 1, fy - 1), ux),
    uy,
  )
}

// FBM: 5 octaves, frequency ×2, amplitude ×0.5 per octave (Task 1.3 Step 3)
function fbm(x: number, y: number, octaves = 5): number {
  let v = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    v += perlin2D(x * freq, y * freq) * amp
    freq *= 2
    amp *= 0.5
  }
  return v
}

// Generate 512×512 Float32Array remapped to [0,1] (Task 1.3 Step 4 + Task 1.4 Step 3)
export function generateFBMTexture(size = 512, octaves = 5, scale = 3.5): Float32Array {
  const data = new Float32Array(size * size)
  let lo = Infinity, hi = -Infinity

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = fbm((x / size) * scale, (y / size) * scale, octaves)
      data[y * size + x] = v
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }

  // Linear remap to [0,1] — ensures burn threshold uses full dynamic range
  const range = hi - lo
  for (let i = 0; i < data.length; i++) data[i] = (data[i] - lo) / range

  return data
}
