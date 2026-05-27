export interface GalleryColumnData {
  /** 滚动速度倍率，0 = 不动 */
  speed: number;
  /** 这列的占位色板（从这里循环取色） */
  palette: readonly string[];
  /** 这列有几张图 */
  itemCount: number;
}

export const defaultColumns: GalleryColumnData[] = [
  {
    speed: 0,
    palette: ['#3a2e5c', '#4a3b78', '#5a4a94', '#6a5ab0'],
    itemCount: 8,
  },
  {
    speed: 0.15,
    palette: ['#1e4d3f', '#2a6e58', '#368f72', '#42b08b'],
    itemCount: 9,
  },
  {
    speed: 0.4,
    palette: ['#5c3a2e', '#783b2a', '#944a36', '#b05a42'],
    itemCount: 11,
  },
];