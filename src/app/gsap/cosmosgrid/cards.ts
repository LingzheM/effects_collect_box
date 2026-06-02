export interface CosmosCardData {
  icon: string;
  title: string;
  description: string;
}

export const defaultCards: CosmosCardData[] = [
  { icon: '🌌', title: 'NEBULA',  description: '星云:由尘埃、氢气、氦气和其他电离气体聚集而成的星际云。' },
  { icon: '⚡', title: 'PULSAR',  description: '脉冲星:周期性发射脉冲信号的极高密度旋转中子星。' },
  { icon: '🔮', title: 'QUASAR',  description: '类星体:极其明亮的活跃星系核,由超大质量黑洞驱动。' },
  { icon: '🌀', title: 'GRAVITY', description: '引力:具有质量或能量的物体之间相互吸引的自然现象。' },
  { icon: '🪐', title: 'ORBIT',   description: '轨道:天体在引力作用下围绕另一个天体运行的路径。' },
  { icon: '🌑', title: 'ECLIPSE', description: '食:一个天体完全或部分进入另一个天体阴影的现象。' },
  { icon: '☄️', title: 'COMET',   description: '彗星:冰冷的小型太阳系天体,靠近太阳时会展现出彗尾。' },
  { icon: '✨', title: 'AURORA',  description: '极光:高能带电粒子流使高层大气分子激发或电离产生的发光现象。' },
  { icon: '🕳️', title: 'VOID',    description: '虚空:宇宙中纤维状结构之间的巨大空间,包含极少的星系。' },
];