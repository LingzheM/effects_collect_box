"use client"

import { useMemo } from "react";
import { motion } from 'framer-motion';

const mockCards = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  color: `hsl(${i * 45}, 80%, 60%)`,
  title: `Card ${i + 1}`
}));

export const CardGalleryStage = () => {
  const cards = mockCards;
  const N = cards.length;

  // 物理参数配置
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 400;
  const GAP = 40; //卡片间距

  // 预计算半径和角度
  const { radius, theta } = useMemo(() => {
    const angle = 360 / N;
    const r = (CARD_WIDTH + GAP) / 2 / Math.tan(Math.PI / N);
    return { radius: r, theta: angle };
  }, [N, CARD_WIDTH, GAP]);

  return (
    <div
      className="scene-container"
      style={{
        width: '100vw',
        height:'100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',  // 数值越小，3D畸变越强烈
        overflow: 'hidden',
        backgroundColor: 'f5f4ef'
      }}
    >
      <motion.div
        className="gallery-ring"
        style={{
          position: 'relative',
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transformStyle: 'preserve-3d',  // 允许子元素在三维空间分布
        }}
      >
        {cards.map((card, index) => {
          const rotateY = index * theta;
          return (
            <motion.div
              key={card.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: card.color,
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',

                // 顺序绝对不能反：先原地旋转（面向外），然后再往前（Z轴）推出去
                transform: `rotateY(${rotateY}deg) translateZ(${radius}px)`,
              }}
            >
              {card.title}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  )
}