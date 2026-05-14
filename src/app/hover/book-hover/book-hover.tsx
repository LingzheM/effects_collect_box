"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export interface SpringConfig {
  stiffness: number
  damping: number
}

interface BookCoverProps {
  spring?: SpringConfig
}

export function BookCover({ spring = { stiffness: 300, damping: 20 } }: BookCoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  const springTransition = {
    type: "spring" as const,
    stiffness: spring.stiffness,
    damping: spring.damping,
    restDelta: 0.001,
  }

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      style={{
        width: 240,
        aspectRatio: "3 / 4",
        position: "relative",
        perspective: 1200,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <motion.div
        animate={{ x: isOpen ? 60 : 0, y: isOpen ? -30 : 0, scale: isOpen ? 1.05 : 1 }}
        transition={springTransition}
        style={{
          position: "absolute",
          inset: 0,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
          padding: 20,
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 18 }}>Surprise!</h3>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>点一下盖会去</p>
      </motion.div>
      <motion.div
        animate={{ rotateY: isOpen ? -165 : 0 }}
        transition={springTransition}
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          borderRadius: 10,
          transformOrigin: "left center",
          backfaceVisibility: "hidden",
          boxShadow: "0 12px 32px rgba(29, 78, 216, 0.35)",
          padding: 20,
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, opacity: 0.8, letterSpacing: 1 }}>PRESS TO OPEN</span>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Folder</h2>
      </motion.div>
    </div>
  )
}
