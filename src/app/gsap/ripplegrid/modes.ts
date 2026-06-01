export type RippleMode = 'start' | 'center' | 'edges' | 'random' | 'grid';

// GSAP stagger 配置的形状(我们用到的字段)
export interface StaggerConfig {
  each?: number;
  from?: 'start' | 'center' | 'edges' | 'random' | 'end';
  grid?: [number, number];   // [行, 列]
  amount?: number;
}

export interface ModeDefinition {
  /** 按钮上显示的文字 */
  label: string;
  /** 传给 GSAP 的 stagger 配置 */
  stagger: StaggerConfig;
  /** readout 区显示的代码(含高亮 span) */
  code: string;
  /** readout 区的解说(含 <b> 强调) */
  tip: string;
}

export const GRID_ROWS = 6;
export const GRID_COLS = 8;

// 用 Record<RippleMode, ...> 保证每个模式都有定义,漏写会被 TS 抓出来
export const MODES: Record<RippleMode, ModeDefinition> = {
  start: {
    label: '从角落推过去',
    stagger: { each: 0.04, from: 'start' },
    code: `stagger: { each: 0.04, <span class="key">from: "start"</span> }`,
    tip: `<b>start</b>:从第一个格子开始,像一道线扫过去。最朴素的顺序。`,
  },
  center: {
    label: '从中心炸开',
    stagger: { each: 0.04, from: 'center' },
    code: `stagger: { each: 0.04, <span class="key">from: "center"</span> }`,
    tip: `<b>center</b>:从中间向两端扩散。注意——这是<b>一维</b>的中心,按 DOM 顺序算。`,
  },
  edges: {
    label: '从两边汇拢',
    stagger: { each: 0.04, from: 'edges' },
    code: `stagger: { each: 0.04, <span class="key">from: "edges"</span> }`,
    tip: `<b>edges</b>:从两头同时往中间汇拢。`,
  },
  random: {
    label: '随机闪烁',
    stagger: { each: 0.04, from: 'random' },
    code: `stagger: { each: 0.04, <span class="key">from: "random"</span> }`,
    tip: `<b>random</b>:随机次序点亮,像噪点 / 星星闪烁。`,
  },
  grid: {
    label: '网格波纹 ◎',
    stagger: { grid: [GRID_ROWS, GRID_COLS], from: 'center', amount: 1.0 },
    code: `stagger: {\n  <span class="key">grid: [6, 8]</span>,   // 告诉它这是二维网格\n  from: "center",\n  <span class="key">amount: 1.0</span>   // 整段总共 1 秒铺完\n}`,
    tip: `<b>网格波纹</b>:给了 <code>grid:[行,列]</code> 后,"center" 变成<b>真正的二维中心</b>,像石子入水一圈圈扩散。这是 stagger 的杀手锏,CSS 做不出来。`,
  },
};

export const MODE_ORDER: RippleMode[] = ['start', 'center', 'edges', 'random', 'grid'];