
import { useRef } from 'react';
import { gsap } from 'gsap/gsap-core';
import styles from './SpaceProbe.module.css';
import { useGSAP } from '@gsap/react';

export function SpaceProbe() {
  const probeRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const { contextSafe } = useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from(probeRef.current, {
      y: -500, scale: 0, duration: 1.5, ease: 'back.out(1.7)',
    })
      .to(beamRef.current, { opacity: 1, duration: 0.3 })
      .fromTo(beamRef.current,
        { rotation: -30 },
        { rotation: 30, duration: 0.8, repeat: 3, yoyo: true, ease: 'sine.inOut' }
      )
      .to(alertRef.current, {
        opacity: 1, y: -20, duration: 0.5, color: '#ff0055',
        onStart: () => console.log('发现目标'),
      })
      .to(probeRef.current, { x: 10, repeat: 5, yoyo: true, duration: 0.1 });

    timelineRef.current = tl;
  }); 

  const handleReplay = contextSafe(() => timelineRef.current?.restart());

  return (
    <div className={styles.stage}>
      <div className={styles.controls}>
        <button className={styles.button} onClick={handleReplay}>
          重新播放
        </button>
      </div>

      <div className={styles.probeContainer}>
        <div ref={probeRef} className={styles.probeBody} />
        <div ref={beamRef} className={styles.scanBeam} />
        <div ref={alertRef} className={styles.alertText} >Target Detected</div>
      </div>
    </div>
  );
}