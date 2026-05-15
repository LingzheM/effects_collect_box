"use client"

import { motion } from "framer-motion";
import { useState } from "react";

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

interface BookCoverProps {
  spring?: SpringConfig;
}

export function BookCover({
  spring = { stiffness: 300, damping: 20 },
}: BookCoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const springTransition = {
    type: 'spring' as const,
    stiffness: spring.stiffness,
    damping: spring.damping,
    restDelta: 0.001,
  };

  const folderBaseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    boxShadow: '0 12px 32px rgba(29. 78, 216, 0.2)',
  };

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        width: 240,
        aspectRatio: '3 / 4',
        position: 'relative',
        perspective: 1200,
        cursor: 'pointer',
        userSelect: 'none', 
      }}
    >
      {/** 文件夹后壳 (Back Flap) - 始终静止在最底层 */}
      <div style={{ ...folderBaseStyle, zIndex: 1 }}/>

      {/** 中间的文件卡片 (Card) - 层级为 2 */}
      <motion.div
        animate={{
          x: isOpen ? 40 : 0, // 稍微向右偏移
          y: isOpen ? -60 : 0,  // 向上滑出更多，制造“抽出来”的感觉
          scale: isOpen ? 1.05 : 1,
          rotate: isOpen ? 2 : 0, // 旋转感
        }}
          transition={springTransition}
          style={{
            position: 'absolute',
            inset: '5px',
            zIndex: 2,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 32px rgba(0, 0, 0, 0.1)',
            padding: 20,
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          >
            <h3 style={{ margin: 0, fontSize: 18 }}>Suprise!</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              内部机密
            </p>
      </motion.div>
      
      {/** 3. 前盖（Front Flap） - 层级为3 */}
      <motion.div
        animate={{ rotateY: isOpen ? -110: 0 }}
        transition={springTransition}
        style={{
          ...folderBaseStyle,
          zIndex: 3,
          transformOrigin: 'left center',
          backfaceVisibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 20,
          color: 'white',
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.8, letterSpacing: 1 }}>
          CONFIDENTIAL
        </span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Folder</h2>
      </motion.div>
    </div>
  )
}