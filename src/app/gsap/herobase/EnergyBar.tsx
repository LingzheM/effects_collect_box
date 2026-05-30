import { useRef } from 'react';
import { gsap } from 'gsap';
import styles from './HeroBase.module.css';

interface EnergyBarProps {
  /** 充能时长(秒) */
  chargeDuration?: number;
}

export function EnergyBar({ chargeDuration = 1.5 }: EnergyBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  // 充能:fromTo 明确指定 0% → 100%
  const charge = () => {
    gsap.fromTo(
      barRef.current,
      { width: '0%' },                          // 起点
      { width: '100%', duration: chargeDuration, ease: 'power2.out' } // 终点
    );
  };

  return (
    <>
      <div className={styles.barContainer}>
        <div ref={barRef} className={styles.bar} />
      </div>
      <button className={styles.btn} onClick={charge}>
        激活超能力蓄能 (fromTo)
      </button>
    </>
  );
}