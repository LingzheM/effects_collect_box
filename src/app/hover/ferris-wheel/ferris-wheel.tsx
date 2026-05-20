"use client";

import { useEffect, useRef } from "react";

const CARDS = [
  { id: 'ambiguity', title: 'Ambiguity', tag: 'Effect No 01', bg: '#E8C49A', monster: '#A85A3C', shape: 0, eyes: 2, featured: true }
]

const RADIUS = 320;   // wheel radius in px
const ROTATION_SPEED = 6; // degrees per second (positive = clockwise)
const CARD_W = 180;
const CARD_H = 250;

function CardFace({ card }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#FBF7EE',
        boxShadow: '0 24px 50px -20px rgba(0,0,0,0.55), 0 8px 22px -10px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <div style={{ flex: '0 0 60%', background: card.bg, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.12em',
            color: 'rgba(0,0,0,0.45)',
            textTransform: 'uppercase',
          }}
        >
          {card.id.slice(0, 3)}
        </div>
      </div>
    </div>
  )
}

export default function FerrisWheelGallery() {
  const wheelRef = useRef(null);
  const rotationRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    const id = 'cg-fonts';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.append(link);
    }

    const tick = (now) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      rotationRef.current = (rotationRef.current + ROTATION_SPEED * dt) % 360;
      if (wheelRef.current) {
        // Single CSS variable update drives every card's transform
        wheelRef.current.style.setProperty('--rotation', `${rotationRef.current}deg`);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
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
      {/** grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.06,
          mixBlendMode: 'overlay',
        }}
      />

      {/** faint wheel rim - just a hint of the structure */}
      <svg
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: RADIUS * 2 + 4,
          height: RADIUS * 2 + 4,
          pointerEvents: 'none',
        }}
        viewBox={`0 0 ${RADIUS * 2 + 4} ${RADIUS * 2 + 4}`}
      >
      </svg>
      {/** header */}
      <div>
        <div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.22cm',
              opacity: 0.5,
              textTransform: 'uppercase',
            }}
          >
            A Field Guide To
          </div>
          <div>

          </div>
        </div>
      </div>
      {/** the wheel */}
      <div
        ref={wheelRef}
        style={{
          position: 'absolute',
          inset: 0,
          '--rotation': '0deg',
        }}
      >
        {/** central hub - just a small dot to anchor the wheel metaphor */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            borderRadius: '50%',
            background: '#E8C49A',
            boxShadow: '0 0 16px rgba(232, 196, 154, 0.4), 0 0 40px rgba(232, 196, 154, 0.15)',
          }}
        />

        {/** cars on the rim */}
        {CARDS.map((card, i) => {
          const cardAngle = (i / CARDS.length) * 360;
          return (
            <div
              key={card.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: CARD_W,
                height: CARD_H,
                marginLeft: -CARD_W / 2,
                marginTop: -CARD_H / 2,
                // Three-stage transform:
                // 1. rotate(angle + currentRotation) -> orient to position on wheel
                // 2. translateY(-RADIUS) -> push out to the rim
                // 3. rotate(-(angle + rotation)) -> counter-rotate to stay upright
                // the two rotations cancel exactly for the card orientation, but
                // the translateY in between picks up the rotated position.
                transform: `rotate(calc(${cardAngle}deg + var(--rotation))) translateY(-${RADIUS}px) rotate(calc(-1 * (${cardAngle}deg + var(--rotation))))`,
                willChange: 'transform',
              }}
            >
              <CardFace card={card}/>
            </div>
          )
        })}
      </div>
    </div>
  )
}