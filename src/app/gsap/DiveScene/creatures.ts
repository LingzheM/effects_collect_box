/** 根据深度(米)返回所在海洋分区的名字 */
export function getDepthZone(depth: number): string {
  if (depth < 200) return '阳光带 · Sunlight';
  if (depth < 1000) return '暮光带 · Twilight';
  if (depth < 4000) return '午夜带 · Midnight';
  return '深渊带 · Abyss';
}

/** 背景色随下潜变深的关键帧(颜色 + 在 timeline 上的时间点) */
export const BG_KEYFRAMES = [
  { color: '#2f86b8', duration: 2, at: 0 },
  { color: '#16527e', duration: 2, at: 2 },
  { color: '#0a2f4d', duration: 3, at: 4 },
  { color: '#01080f', duration: 3, at: 7 },
] as const;