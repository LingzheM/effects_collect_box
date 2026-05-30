import { useRef } from "react";
import { HeroBadge } from "./HeroBadge";
import { EnergyBar } from "./EnergyBar";
import styles from './HeroBase.module.css';

export function HeroBase() {

  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={rootRef} className={styles.root}>
      <HeroBadge></HeroBadge>
      <EnergyBar />
    </div>
  )
}