"use client";

import { useRef, useState } from "react";
import { CosmosCardData, defaultCards } from "./cards";
import { CosmosCard } from "./CosmosCard";
import styles from './CosmosGrid.module.css';
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { UseCardTransition } from "./useCardTransition";

interface CosmosGridProps {
  cards?: CosmosCardData[];
}

export default function CosmosGrid({ cards = defaultCards}: CosmosGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // 核心状态：当前选中的卡片索引
  const[activeIndex, setActiveIndex] = useState<number | null>(null);
  // 防止动画进行中重复触发
  const isAnimating = useRef(false);

  const { expand, collapse } = UseCardTransition({ gridRef, detailRef });

  useGSAP(
    () => {
      gsap.from('.card', {
        duration: 1,
        scale: 0,
        y: 40,
        opacity: 0,
        stagger: { grid: [3, 3], from: 'center', amount: 0.5 },
        ease: 'back.out(1.5)',
      });
    },
    { scope: gridRef }
  )

  const handleCardClick = (index: number, cardEl: HTMLDivElement | null) => {
    if (activeIndex !== null || isAnimating.current || !cardEl) return;

    isAnimating.current = true;
    setActiveIndex(index);
    expand(cardEl, () => {
      isAnimating.current = false;
    });
  };

  return (
    <div className={styles.stage}>
      <div className={styles.bgGlow} />
      <div ref={gridRef} className={styles.gridContainer}>
        {cards.map((card, i) => (
          <CardWithRef
            key={i}
            {...card}
            onClick={(el) => handleCardClick(i, el)}
          />
        ))}
      </div>
    </div>
  )
}

function CardWithRef({
  onClick,
  ...card
}: CosmosCardData & { onClick: (el: HTMLDivElement | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return <CosmosCard ref={ref} {...card} onClick={() => onClick(ref.current)} />;
}