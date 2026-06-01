export type RippleMode = 'start' | 'center' | 'edges' | 'random' | 'grid';

export interface StaggerConfig {
  each?: number;
  from?: 'start' | 'center' | 'edges' | 'random' | 'end';
  grid?: [number, number];
  amount?: number;
}

export interface ModeDefinition {
  /** 按钮上显示的文字 */
  label: string;
  /** 传给 GSAP 的 stagger 配置 */
  stagger: StaggerConfig;
  /** readout 区显示的代码 */
  code: string;
  /** readout 区的解说（含 <b> 强调） */
  tip: string;
}

export const GRID_ROWS = 6;
export const GRID_COLS = 8;

// 用 Record<RippleMode, ...> 保证每个模式都有定义
export const MODES: Record<RippleMode, ModeDefinition> = {
  start: {
    label: '从角落推过去',
    stagger: { each: 0.04, from: 'start' },
    code: `stagger: { each: 0.04, <span class="key">from: "start"</span> }`,
    tip: `<b>start</b>:从第一个格子开始，像一道线扫过去。`
  }
}

export const MODE_ORDER: RippleMode[] = ['start'];