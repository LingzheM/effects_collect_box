'use client';

import type { OrbitConfig, Shape } from "./types";
import { ITEM_LABELS } from './data';
import { useFrontIndex } from "./hooks/useFrontIndex";
import styles from './OrbitCarousel.module.css'
import { CSSProperties, useMemo, useRef, useState } from "react";
import { OrbiItem } from "./OrbitItem";

export interface OrbitCarouselProps {
  /** 完整配置；支持部分覆盖默认值 */
  config?: Partial<OrbitConfig>;
  /** 当前活动项变化时回调 */
  onActiveChange?: (index:number) => void;
}

const DEFAULT_CONFIG: OrbitConfig = {
  count: 8,
  speed: 24,
  depth: 380,
  itemWidth: 220,
  itemHeight: 300,
  radius: 14,
  tilt: 8,
  backface: true,
  pauseOnHover: true,
  autoplay: true,
  direction: 'cw',
  theme: 'dark',
  showLabels: true,
  shape: 'rounded',
};

function getBorderRadius(shape: Shape, radius: number, w: number, h: number) {
  switch (shape) {
    case 'none':    return 0;
    case 'rounded': return radius;
    case 'pill':
    case 'circle':  return Math.min(w, h) / 2;
  }
}

export function OrbitCarousel({ config, onActiveChange } : OrbitCarouselProps) {

  // 合并默认配置和用户传入
  const t: OrbitConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // 核心状态
  const [angle, setAngle] = useState(0);
  const [playing, setPlaying] = useState(t.autoplay);
  const [hovered, setHovered] = useState(false);

  // 派生值
  const frontIdx = useFrontIndex(angle, t.count);
  const isPaused = !playing || (t.pauseOnHover && hovered);
  const borderRadius = getBorderRadius(
    t.shape,
    t.radius,
    t.itemWidth,
    t.itemHeight
  );

  // 拖拽
  const stageRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    return Array.from({ length: t.count }, (_, i) => ({
      id: `slot-${i}`,
      index: i,
      label: ITEM_LABELS[i % ITEM_LABELS.length],
      angle: (360 / t.count) * i,
    }));
  }, [t.count]);

  // 渲染
  const orbitStyle: CSSProperties = {
    width: t.itemWidth,
    height: t.itemHeight,
    transform: `rotateX(${-t.tilt}deg) rotateY(${angle}deg)`,
  }

  return (
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.ground} />
      <div className={styles.orbit} style={orbitStyle}>
        {items.map((it) => (
          <OrbiItem
            key={it.id}
            index={it.index}
            label={it.label}
            angle={it.angle}
            isActive={it.index === frontIdx && !isPaused}
            borderRadius={borderRadius}
            config={t}
            onClick={() => setAngle(-it.angle)}
          />
        ))}
      </div>
    </div>
  )
}