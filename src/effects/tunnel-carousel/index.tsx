'use client'

import { TunnelCarousel } from './TunnelCarousel'

// Self-contained stage: the spacer provides scroll height (500vh = 5 screens),
// the carousel itself is fixed full-screen. (Absorbed from the former page.tsx.)
export default function TunnelCarouselEffect() {
  return (
    <>
      <div style={{ height: '500vh', background: '#f0f0f0' }} />
      <TunnelCarousel />
    </>
  )
}
