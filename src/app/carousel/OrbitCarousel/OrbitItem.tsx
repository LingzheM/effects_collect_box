import { type CSSProperties } from 'react';
import styles from './OrbitCarousel.module.css';
import { ItemLabel, OrbitConfig } from "./types";

interface OrbiItemProps {
  /** 该项在轨道上的索引 */
  index: number;
  /** 卡片标签 */
  label: ItemLabel;
  /** 该卡片在轨道上的角度 */
  angle: number;
  /** 是否是当前最靠前的项目 */
  isActive: boolean;
  /** 圆角  */
  borderRadius: number;
  /** 配置子集 */
  config: Pick<
  OrbitConfig,
  'itemWidth' | 'itemHeight' | 'depth' | 'backface' | 'showLabels' | 'theme'
>;
  /** 点击卡片（让它转到正面 */
  onClick: () => void;
  /** 鼠标进入/ */

}

export function OrbiItem({
  index,
  label,
  angle,
  isActive,
  borderRadius,
  config,
  onClick,
}: OrbiItemProps) {

  const dynamicStyle: CSSProperties = {
    width: config.itemWidth,
    height: config.itemHeight,
    marginLeft: -config.itemWidth / 2,
    marginTop: -config.itemHeight / 2,
    borderRadius,
    transform: `rotateY(${angle}deg) translateZ(${config.depth}px)`,
    backfaceVisibility: config.backface ? 'visible' : 'hidden',
  };

  return (
    <div
      className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
      style={dynamicStyle}
      >

    </div>
  )
}