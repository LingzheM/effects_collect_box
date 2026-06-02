import { RefObject, useCallback } from "react";
import { gsap } from "gsap";
import { createParticleExplosion } from "./particles";

interface UseCardTransitionOptions {
  gridRef: RefObject<HTMLDivElement | null>;

  detailRef: RefObject<HTMLDivElement | null>;
}


export function UseCardTransition({ gridRef, detailRef}: UseCardTransitionOptions) {
  /** 展开：从某张卡片爆破进入 */

  const expand = useCallback(
    (clickedCard: HTMLElement, onDone?: () => void) => {
      const grid = gridRef.current;
      const detail = detailRef.current;
      if (!grid) return;

      const cards = gsap.utils.toArray<HTMLElement>(grid.querySelectorAll('.card'));
      const clickedIndex = cards.indexOf(clickedCard);

      const tl = gsap.timeline({ onComplete: onDone });

      // 1. 点击卡片轻微收缩
      tl.to(clickedCard, { scale: 0.9, duration: 0.1, ease: 'power2.in' })
        // 2. 所有卡片涟漪四散
        .to(cards, {
          filter: 'blur(8px)',
          opacity: 0,
          scale: 0.5,
          y: (_, target) => (target === clickedCard ? 0 : Math.random() * 200 - 100),
          x: (_, target) => (target === clickedCard ? 0 : Math.random() * 200 - 100),
          stagger: { grid: [3, 3], from: clickedIndex, amount: 0.2 },
          duration: 0.4,
          ease: 'power2.in',
        })
        // 3. 点击卡片放大消失
        .to(clickedCard, { scale: 1.5, opacity: 0, duration: 0.2, ease: 'power3.inOut' }, '-=0.2');
        // 4. 粒子爆破
        tl.add(() => {
          const rect = clickedCard.getBoundingClientRect();
          createParticleExplosion({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          });
        }, '-=0.1');

      return tl;

    }, 
    [gridRef, detailRef]);

  const collapse = useCallback(() => {}, [gridRef, detailRef]);
  return { expand, collapse };
}