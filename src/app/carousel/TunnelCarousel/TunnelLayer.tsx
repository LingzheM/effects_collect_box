import { CSSProperties } from 'react';
import styles from './TunnelCarousel.module.css'

interface TunnelLayerProps {
  /** 在隧道中的索引 */
  index: number;
  /** Z轴间距（单位 px） */
  gap: number;
  /** 图片URL */
  src: string;
  /** 可选文本 */
  alt?: string;
}

export default function TunnelLayer({ index, gap, src, alt }: TunnelLayerProps) {
  
  const layerStyle: CSSProperties = {
    transform: `translateZ(${-index * gap}px)`,
  }

  return (
    <div className={styles.layer} style={layerStyle}>
      <img 
        src={src}
        alt={alt ?? `layer ${index + 1}`}
        className={styles.image}
        draggable={false}
      />
    </div>
  )
}