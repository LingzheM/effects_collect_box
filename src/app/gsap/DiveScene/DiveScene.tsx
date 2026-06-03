"use client";
import { useRef } from 'react';
import { DepthHud } from './DepthHud';
import { useDiveTimeline } from './useDiveTimeline';
import styles from './DiveScene.module.css';

export function DiveScene() {
  const sceneRef = useRef<HTMLElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  // 滚动驱动的主时间轴
  useDiveTimeline({ sceneRef, depthRef, zoneRef });

  return (
    <>
      {/* 进入屏:海面 */}
      <section className={styles.intro}>
        <div className={styles.kicker}>GSAP 第五课 · ScrollTrigger</div>
        <h1 className={styles.introTitle}>下 潜</h1>
        <p>向下滚动,你就是那束正在沉入海里的目光</p>
        <div className={styles.scrollHint}>↓</div>
      </section>

      {/* 下潜场景:会被 pin 钉住 */}
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

      {/* 离开屏:海底 */}
      <section className={styles.outro}>
        <h2>海底 · 11,000 m</h2>
        <p>马里亚纳海沟的最深处。光,早已不存在了。</p>
      </section>

      <div className={styles.teach}>
        <b>正在发生:</b>你的滚动条 = 这条时间线的播放头。<br />
        场景被 <code>pin</code> 钉住不动,背景色、生物、深度全靠 <code>scrub</code> 跟着滚动走。
      </div>
    </>
  );
}