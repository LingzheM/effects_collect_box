import type { RefObject } from 'react';
import styles from './DiveScene.module.css';

interface DepthHudProps {
  depthRef: RefObject<HTMLDivElement | null>;
  zoneRef: RefObject<HTMLDivElement | null>;
}

export function DepthHud({ depthRef, zoneRef }: DepthHudProps) {
  return (
    <div className={styles.hud}>
      <div className={styles.depth} ref={depthRef}>0 m</div>
      <div className={styles.zone} ref={zoneRef}>阳光带 · Sunlight</div>
    </div>
  );
}