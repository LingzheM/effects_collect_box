"use client";

import { useRef } from "react";
import { CosmosCardData, defaultCards } from "./cards";
import { CosmosCard } from "./CosmosCard";
import styles from './CosmosGrid.module.css';

interface CosmosGridProps {
  cards?: CosmosCardData[];
}

export default function Page({ cards = defaultCards}: CosmosGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (index: number, cardEl: HTMLDivElement | null) => {

  }

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