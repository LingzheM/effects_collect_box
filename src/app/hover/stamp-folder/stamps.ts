export type TextOrientation = 'vertical' | 'horizontal';

export interface StampData {
  text: string;
  textOrientation: TextOrientation;
  priceLabel?: string;
  imageGradient?: string; //邮票图片区的渐变背景
}

export const defaultStamps: StampData[] = [
  {
    text: '海鳥 84円',
    textOrientation: 'horizontal',
    imageGradient: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
  },
  {
    text: '静かな時間',
    textOrientation: 'vertical',
    priceLabel: '63円',
    imageGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
];