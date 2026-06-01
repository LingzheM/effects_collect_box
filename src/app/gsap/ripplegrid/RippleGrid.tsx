"use client";

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { useRipple } from './useRipple';
import {
  MODES,
  MODE_ORDER,
  GRID_ROWS,
  GRID_COLS,
  type RippleMode,
} from './modes';
import styles from './RippleGrid.module.css';

export function RippleGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<RippleMode>('grid');

  const { ripple } = useRipple({ gridRef });

  // 切换模式:跑动画 + 更新高亮按钮
  const run = (mode: RippleMode) => {
    setActiveMode(mode);
    ripple(MODES[mode].stagger);
  };

  // 进页面自动放一次 "grid",最能体现 stagger
  // 用 useGSAP 管理这次挂载时的动画(自动清理 / StrictMode 安全)
  useGSAP(() => {
    ripple(MODES.grid.stagger);
  });

  const totalCells = GRID_ROWS * GRID_COLS;
  const current = MODES[activeMode];

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.kicker}>GSAP 第三课 · 地基</div>
        <h1 className={styles.title}>
          一条命令,让一批元素错落起来
        </h1>
        <p className={styles.subtitle}>
          同一个网格,只改 <code>from</code> 一个词,波就从不同地方开始流动。
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
            className={`${styles.button} ${
              mode === activeMode ? styles.buttonActive : ''
            }`}
            onClick={() => run(mode)}
          >
            {MODES[mode].label}
          </button>
        ))}
      </div>

      <div className={styles.readout}>
        {/* 代码片段含 HTML 高亮标签,用 dangerouslySetInnerHTML 渲染 */}
        <pre
          className={styles.code}
          dangerouslySetInnerHTML={{
            __html: `gsap.<span class="${styles.hl}">to</span>(cells, {\n  backgroundColor:"#c0532f", scale:1.12,\n  yoyo:true, repeat:1, duration:0.45,\n  ${current.code}\n});`,
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