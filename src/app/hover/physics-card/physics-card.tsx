'use client'

import React, { useRef } from "react";
import styles from './card.module.css';

interface PhysicsCardProps {
  children?: React.ReactNode;
  maxRotation?: number;
}

export function PhysicsCard({
  children,
  maxRotation = 15,
}: PhysicsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const percentX = (x - centerX) / centerX;
    const percentY = (y - centerY) / centerY;

    const rotateX = -percentX * maxRotation;
    const rotateY = percentY * maxRotation;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;

    const shadowX = -percentX * 25;
    const shadowY = -percentY * 25;
    card.style.boxShadow = `${shadowX}px ${shadowY}px 35px rgba(0, 0, 0, 0.35)`;

    if (glare) {
      glare.style.setProperty('--x', `${(x / rect.width) * 100}%`);
      glare.style.setProperty('--y', `${(y / rect.height) * 100}%`);
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
  };

  return (
    <div className={styles.stage}>
      <div
        ref={cardRef}
        className={styles.card}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.parallaxContent}>
          {children}
        </div>
        <div ref={glareRef} className={styles.glare} />
      </div>
    </div>
  );
}
