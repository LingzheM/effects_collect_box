import styles from './ScrollGallery.module.css';

interface GalleryItemProps {
  /** 图片URL：不传则显示占位色块 */
  src?: string;
  /** 图 alt 文案 */
  alt?: string;
  /** 占位色块的背景色 */
  placeholderColor?: string;
  /** 占位文字 */
  placeholderLabel?: string;
}

export function GalleryItem({
  src,
  alt = '',
  placeholderColor,
  placeholderLabel,
}: GalleryItemProps) {
  
  if (src) {

  }
  return (
    <div
      className={`${styles.item} ${styles.itemPlaceholder}`}
      style={{ background: placeholderColor }}
    >
      {placeholderLabel}
    </div>
  )
}