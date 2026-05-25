// src/app/orbit/page.tsx
'use client';

import { OrbitCarousel } from "./OrbitCarousel";

export default function OrbitPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d0d10',
      }}
    >
      <OrbitCarousel />
    </div>
  );
}