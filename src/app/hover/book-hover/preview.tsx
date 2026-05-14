"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const spring = { type: "spring" as const, stiffness: 300, damping: 20, restDelta: 0.001 }

export function BookHoverPreview() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setIsOpen((v) => !v), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <div style={{ width: 110, aspectRatio: "3/4", position: "relative", perspective: 1200 }}>
        <motion.div
          animate={{ x: isOpen ? 28 : 0, y: isOpen ? -14 : 0, scale: isOpen ? 1.05 : 1 }}
          transition={spring}
          style={{
            position: "absolute",
            inset: 0,
            background: "#fff",
            borderRadius: 7,
            boxShadow: "0 6px 16px rgba(15,23,42,0.12)",
          }}
        />
        <motion.div
          animate={{ rotateY: isOpen ? -165 : 0 }}
          transition={spring}
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            borderRadius: 7,
            transformOrigin: "left center",
            backfaceVisibility: "hidden",
            boxShadow: "0 6px 16px rgba(29,78,216,0.35)",
          }}
        />
      </div>
    </div>
  )
}
