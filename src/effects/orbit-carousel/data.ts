import type { ItemLabel, Theme } from './types';

export const ITEM_LABELS: ItemLabel[] = [
  { tag: '01', title: 'Aurora',   sub: '01 / Series' },
  { tag: '02', title: 'Drift',    sub: '02 / Series' },
  { tag: '03', title: 'Halcyon',  sub: '03 / Series' },
  { tag: '04', title: 'Marrow',   sub: '04 / Series' },
  { tag: '05', title: 'Nocturne', sub: '05 / Series' },
  { tag: '06', title: 'Pollen',   sub: '06 / Series' },
  { tag: '07', title: 'Quartz',   sub: '07 / Series' },
  { tag: '08', title: 'Reverie',  sub: '08 / Series' },
  { tag: '09', title: 'Solace',   sub: '09 / Series' },
  { tag: '10', title: 'Tessera',  sub: '10 / Series' },
  { tag: '11', title: 'Umbra',    sub: '11 / Series' },
  { tag: '12', title: 'Vellum',   sub: '12 / Series' },
];

type Palette = readonly [string, string, string];

const DARK_PALETTES: Palette[] = [
  ['#1d1d22', '#5a4a2a', '#caa164'],
  ['#15191e', '#2c4a5c', '#6ea2c0'],
  ['#1d1517', '#5a2a2e', '#c87680'],
  ['#161a14', '#3a4d2a', '#86a065'],
  ['#1a1620', '#473058', '#a786c8'],
  ['#1c1a13', '#5a4a1f', '#c6ad58'],
];

const LIGHT_PALETTES: Palette[] = [
  ['#e8dcc4', '#c9a875', '#8a6a3a'],
  ['#d6dfe4', '#7a98a9', '#3d5868'],
  ['#e6d4d4', '#b97a7a', '#6e3a3a'],
  ['#dee0d2', '#8a957a', '#4d5b3f'],
  ['#e0d8e4', '#9a85a9', '#574668'],
  ['#e8e2c8', '#bcae7a', '#6b6238'],
];

export function getPalette(theme: Theme, idx: number): Palette {
  const palettes = theme === 'light' ? LIGHT_PALETTES : DARK_PALETTES;
  return palettes[idx % palettes.length];
}