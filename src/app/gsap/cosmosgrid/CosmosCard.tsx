import { forwardRef } from "react";
import { CosmosCardData } from "./cards";
import styles from './CosmosGrid.module.css';

interface CosmosCardProps extends CosmosCardData {
  onClick: () => void;
}

export const CosmosCard = forwardRef<HTMLDivElement, CosmosCardProps>(
  ({ icon, title, onClick }, ref) => (
    <div ref={ref} className={`${styles.card} card`} onClick={onClick}>
      <span className={styles.cardIcon}>{icon}</span>
      <span className={styles.cardTitle}>{title}</span>
    </div>
  )
);

CosmosCard.displayName = 'CosmosCard';