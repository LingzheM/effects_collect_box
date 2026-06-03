/** 根据深度(米)返回所在海洋分区的名字 */
export function getDepthZone(depth: number): string {
  if (depth < 200) return '阳光带 · Sunlight';
  if (depth < 1000) return '暮光带 · Twilight';
  if (depth < 4000) return '午夜带 · Midnight';
  return '深渊带 · Abyss';
}