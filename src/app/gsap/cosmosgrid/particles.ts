

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
  colors = ['#6366f1', 'a855f7'],
}: ParticleOptions) {
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'cosmos-particle';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(particle);
  }
}