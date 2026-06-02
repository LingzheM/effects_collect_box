import { gsap } from "gsap";

interface ParticleOptions {
  x: number;
  y: number;
  count?: number;
  colors?: string[];
}

/**
 * 在指定屏幕坐标创建一个粒子爆破
 */
export function createParticleExplosion({
  x,
  y,
  count = 40,
  colors = ['#6366f1', '#a855f7'],
}: ParticleOptions) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'cosmos-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(particle);

    // 随机散射方向和距离
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 160;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    // 第一段：快速飞出
    gsap.to(particle, {
      x: targetX,
      y: targetY,
      opacity: 1,
      scale: Math.random() * 2 + 1,
      duration: 0.1,
      ease: 'power1.out',
    });

    gsap.to(particle, {
      opacity: 0,
      scale: 0,
      x: targetX * 1.2,
      y: targetY * 1.2,
      delay: 0.1,
      duration: 0.6 + Math.random() * 0.4,
      ease: 'power2.out',
      onComplete: () => particle.remove(),
    });
  }
}