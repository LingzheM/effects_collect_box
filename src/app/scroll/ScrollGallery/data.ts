export interface GalleryColumnData {
  /** 滚动速度倍率，0 = 不动 */
  speed: number;
  /** 这列的占位色板（从这里循环取色） */
  palette: readonly string[];
  /** 这列有几张图 */
  itemCount: number;
}

export const defaultColumns: GalleryColumnData[] = [
  
]