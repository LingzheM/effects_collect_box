import { useMemo, useRef } from "react";
import styles from './TunnelCarousel.module.css'
import TunnelLayer from "./TunnelLayer";

export interface TunnelCarouselProps {
  /** 图片 URL 数组,如果不传就用占位图 */
  images?: string[];
  /** 没传 images 时,生成多少张占位图 */
  layerCount?: number;
  /** 每张图在 Z 轴上的间距(px) */
  gap?: number;
  /** 场景整体倾斜的 X 角度 */
  rotateX?: number;
  /** 场景整体倾斜的 Y 角度 */
  rotateY?: number;
  /** 3D 透视距离 */
  perspective?: number;
  /** 滚动 1px 对应推进多少 px */
  travelFactor?: number;
}


export function TunnelCarousel({
  images,
  layerCount = 15,
  gap = 300,
  rotateX = -20,
  rotateY = -45,
  perspective = 1900,
  travelFactor = 1.5,
}: TunnelCarouselProps) {
  const dollyRef = useRef<HTMLDivElement>(null);

  const layers = useMemo(() => {
    if (images && images.length > 0) return images;
    return Array.from(
      { length: layerCount },
      (_, i) => `https://picsum.photos/400/400?random=${i}`
    );
  }, [images, layerCount]);

  return (
    <div className={styles.viewport} style={{ perspective: `${perspective}px` }}>
      <div
        className={styles.scene}
        style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
      >
        <div ref={dollyRef} className={styles.dolly}>
          {layers.map((src, i) => (
            <TunnelLayer
              key={i}
              index={i}
              gap={gap}
              src={src}
              alt={`tunnel layer ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}