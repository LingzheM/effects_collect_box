"use client";

import { useEffect, useRef } from "react";

export default function FerrisWheelGallery() {
  const wheelRef = useRef(null);
  const rotationRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    const id = 'cg-fonts';
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 720,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 45%, #1B1F2E 0%, #0E1119 55%, #07090F 100%)',
        fontFamily: '"Fraunces", serif',
      }}
    >

    </div>
  )
}