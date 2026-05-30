import { useRef } from "react";
import styles from './HeroBase.module.css';

interface EnergyBarProps {
  /** 充能时长 */
  chargeDuration?: number; 
}

export function EnergyBar({ chargeDuration = 1.5}: EnergyBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className={styles.barContainer}>
        <div ref={barRef} className={styles.bar} />
      </div>
    </>
  )
}