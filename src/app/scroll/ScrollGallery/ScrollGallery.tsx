import { useMemo, useRef } from "react";
import { defaultColumns, GalleryColumnData } from "./data";
import styles from './ScrollGallery.module.css';
import { GalleryColumn } from "./GalleryColumn";

export interface ScrollGalleryProps {
  /** 每列配置，不传则用默认3列占位数据 */
  columns?: GalleryColumnData[];
  /** 实际图片：按[列索引][列内索引] 取值 */
  images?: string[][];
}

export function ScrollGallery({
  columns = defaultColumns,
  images,
}: ScrollGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 为每一列创建一个 ref -- 必须用 useMemo 保证数组引用稳定
  // 否则 useParallaxScroll的依赖里 columns 会变化， effect 反复重启
  const columnRefs = useMemo(
    () => columns.map(() => ({ current: null as HTMLDivElement | null })),
    [columns.length]
  );

  // 为每一列预先算出 items 数据（图片 or 占位）
  const columnsWithItems = useMemo(() => {
    return columns.map((col, colIdx) => {
      const colImages = images?.[colIdx] ?? [];
      const items = Array.from({ length: col.itemCount }, (_, i) => {
        const src = colImages[i];
        if (src) return { src };
        return {
          placeholderColor: col.palette[i % col.palette.length],
          placeholderLabel: `IMG ${colIdx + 1}-${String(i + 1).padStart(2, '0')}`,
        };
      });
      return items;
    });
  }, [columns, images]);

  return (
    <section ref={containerRef} className={styles.gallery}>
      {columnsWithItems.map((items, i) => (
        <GalleryColumn key={i} ref={columnRefs[i]} items={items} />
      ))}
    </section>
  )
}