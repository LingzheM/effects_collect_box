export interface CosmosCardData {
  icon: string;
  title: string;
  description: string;
}

export const defaultCards: CosmosCardData[] = [
  { icon: '🌌', title: 'NEBULA',  description: '星云:由尘埃、氢气、氦气和其他电离气体聚集而成的星际云。' },
  { icon: '⚡', title: 'PULSAR',  description: '脉冲星:周期性发射脉冲信号的极高密度旋转中子星。' },
]