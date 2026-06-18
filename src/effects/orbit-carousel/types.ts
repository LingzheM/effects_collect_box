export type Direction = 'cw' | 'ccw';
export type Shape = 'none' | 'rounded' | 'pill' | 'circle';
export type Theme = 'dark' | 'light';

/** 卡片标签 */
export interface ItemLabel {
  tag: string;
  title: string;
  sub: string;
}

/** 内部配置 */
export interface OrbitConfig {
  count: number;
  speed: Number;
  depth: number;
  itemWidth: number;
  itemHeight: number;
  radius: number;
  tilt: number; // x轴倾角
  backface: boolean;
  pauseOnHover: boolean;
  autoplay: boolean;
  direction: Direction;
  shape: Shape;
  showLabels: boolean;
  theme: Theme;
}