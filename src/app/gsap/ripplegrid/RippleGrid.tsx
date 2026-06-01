"use client";

import styles from './RippleGrid.module.css';
import { useRef, useState } from 'react';
import { GRID_COLS, GRID_ROWS, MODE_ORDER, MODES, RippleMode } from './modes';
import { useGSAP } from '@gsap/react';
import { useRipple } from './useRipple';

export function RippleGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<RippleMode>('start');
  
  const { ripple } = useRipple({ gridRef });

  useGSAP(() => {
    ripple(MODES.grid.stagger);
  });

  const totalCells = GRID_ROWS * GRID_COLS;
  const current = MODES[activeMode];

  return (
    <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={styles.kicker}>GSAP</div>
          <h1 className={styles.title}>
            让一批元素动起来
          </h1>
          <p className={styles.subtitle}>
            同一个网格只改<code>from</code> 一个词，从不同地方开始流动。
          </p>
        </header>

        <div className={styles.stage}>
          <div 
            ref={gridRef}
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 38px)` }}
          >
            {Array.from({ length: totalCells }, (_, i) => (
              <div key={i} className={`${styles.cell} cell`} />
            ))}
          </div>
        </div>

        <div className={styles.controls}>
            {MODE_ORDER.map((mode) => (
              <button
                key={mode}
                className={`${styles.button} ${mode === activeMode ? styles.buttonActive : ''
                }`}
              >
                {MODES[mode].label}
              </button>
            ))}
        </div>

        <div className={styles.readout}>
          <pre 
            className={styles.code}
            dangerouslySetInnerHTML={{
              __html: `gsap.<span class="${styles.h1}">to</span>(cells, {\n backgroundColor:"#c0532f", scale:1.12,\n yoyo:true, repeat:1, duration:0.45,\n ${current.code}\n);`,
            }}
          />
          <div
            className={styles.explain}
            dangerouslySetInnerHTML={{ __html: current.tip }}
          />
        </div>
    </div>
  );
}