"use client";

import { useRef } from "react";
import styles from './DiveScene.module.css';
import { DepthHud } from "./DepthHud";

export function DiveScene() {
  const sceneRef = useRef<HTMLElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);


  return (
    <>
    {/** 进入屏：海面 */}
    <section className={styles.intro}>

    </section>

    {/** 下潜场景：会被 pin 钉住 */}
    <section ref={sceneRef} className={`${styles.dive} dive`}>
      <div className={`${styles.bg} bg`} />
      <div className={`${styles.rays} rays`} />

      <span className={styles.creature} id="tropical">🐠</span>
      <span className={styles.creature} id="tropical2">🐡</span>
      <span className={styles.creature} id="jelly">🪼</span>
      <span className={styles.creature} id="jelly2">🪼</span>
      <span className={styles.creature} id="squid">🦑</span>
      <div className={styles.creature} id="angler">
        <div className={styles.anglerBody} />
        <div className={styles.anglerLure} />
      </div>

      <div className={`${styles.vignette} vignette`} />

      <DepthHud depthRef={depthRef} zoneRef={zoneRef} />
    </section>

    {/** 离开屏：海底 */}
    <section className={styles.outro}>
      <h2>海底 11,000m</h2>
    </section>
    </>
  )
}