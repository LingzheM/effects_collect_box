'use client'

import { OrbitCarousel } from './OrbitCarousel'

// Self-contained stage: the effect owns its full-screen dark backdrop.
// (Absorbed from the former page.tsx wrapper.)
export default function OrbitCarouselEffect() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0d0d10' }}>
      <OrbitCarousel />
    </div>
  )
}
