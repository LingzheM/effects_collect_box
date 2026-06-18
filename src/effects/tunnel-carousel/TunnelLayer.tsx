import type { CSSProperties } from 'react';
import styles from './TunnelCarousel.module.css';

interface TunnelLayerProps {
  /** 在隧道中的索引(0 = 最前) */
  index: number;
  /** Z 轴间距(单位 px) */
  gap: number;
  /** 图片 URL */
  src: string;
  /** 可选的 alt 文本 */
  alt?: string;
}

export function TunnelLayer({ index, gap, src, alt }: TunnelLayerProps) {
  // 每张卡片在 Z 轴上的固定深度:越往后越负
  // 这个值在组件生命周期内不变(除非父组件改 gap),所以是 inline style
  const layerStyle: CSSProperties = {
    transform: `translateZ(${-index * gap}px)`,
  };

  return (
    <div className={styles.layer} style={layerStyle}>
      <img
        src={src}
        alt={alt ?? `layer ${index + 1}`}
        className={styles.image}
        draggable={false}
      />
    </div>
  );
}