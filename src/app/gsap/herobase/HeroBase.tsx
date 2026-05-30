import { useRef } from 'react';
import { HeroBadge } from './HeroBadge';
import { EnergyBar } from './EnergyBar';
import { useBreathingBackground } from './useBreathingBackground';
import styles from './HeroBase.module.css';

export function HeroBase() {
  const rootRef = useRef<HTMLDivElement>(null);

  // 背景呼吸作用在最外层容器上
  useBreathingBackground({ targetRef: rootRef });

  return (
    <div ref={rootRef} className={styles.root}>
      <HeroBadge>⚡</HeroBadge>
      <EnergyBar />
    </div>
  );
}