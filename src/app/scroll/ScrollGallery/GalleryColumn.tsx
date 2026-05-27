import { forwardRef } from "react";
import styles from './ScrollGallery.module.css';
import { GalleryItem } from "./GalleryItem";

interface GalleryColumnProps {
  items: Array<{
    src?: string;
    placeholderColor?: string;
    placeholderLabel?: string;
  }>;
}

/**
 * 用 forwardRef 把外部传进来的 ref 绑到根 <div> 上，
 * useParallaxScroll 才能拿到 DOM 直接操作。
 */
export const GalleryColumn = forwardRef<HTMLDivElement, GalleryColumnProps>(
  ({ items }, ref) => (
    <div ref={ref} className={styles.column}>
      {items.map((item, i) => (
        <GalleryItem key={i} {...item} />
      ))}
    </div>
  )
)