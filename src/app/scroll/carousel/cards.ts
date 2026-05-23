export interface CardData {
  emoji: string;
  title: string;
  description: string;
}

export const defaultCards: CardData[] = [
  { emoji: '☕', title: 'Office Energy',   description: 'A natural sweet boost between meetings' },
  { emoji: '⚡', title: 'Energy Boost',    description: 'Perfect pre-workout fuel for athletes' },
  { emoji: '🍯', title: 'Naturally Sweet', description: "No added sugar, just nature's candy" },
  { emoji: '🎒', title: 'Travel Ready',    description: 'Lightweight pack for any adventure' },
  { emoji: '🧒', title: 'Kid Friendly',    description: 'Wholesome snack parents trust' },
  { emoji: '🎁', title: 'Gift Worthy',     description: 'Beautifully packaged for sharing' },
];