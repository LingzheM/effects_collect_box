/**
 * 高斯钟形：接近 0.5 时返回 -1， 远离 0.5 迅速衰减到 0
 * 用来判断卡片“位于路径中央的程度”
 */
export function bell(t: number, sharpness = 4): number {
  const x = (t - 0.5) *sharpness;
  return Math.exp(- x * x);
}