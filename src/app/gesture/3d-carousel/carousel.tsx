"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type React from "react"

const CARD_COUNT = 7
const RADIUS = 320
const AUTO_SPEED = 0.003

const CARDS = [
  { title: "Alpine Dawn",  subtitle: "Swiss Highlands",  color: "#2d6a4f", accent: "#95d5b2" },
  { title: "Tokyo Neon",   subtitle: "Shibuya Crossing", color: "#7b2cbf", accent: "#e0aaff" },
  { title: "Desert Gold",  subtitle: "Sahara Dunes",     color: "#b08968", accent: "#ffe0b2" },
  { title: "Arctic Blue",  subtitle: "Northern Lights",  color: "#023e8a", accent: "#90e0ef" },
  { title: "Kyoto Bloom",  subtitle: "Cherry Season",    color: "#c9184a", accent: "#ffccd5" },
  { title: "Noir Paris",   subtitle: "Midnight Seine",   color: "#2b2d42", accent: "#8d99ae" },
  { title: "Coral Reef",   subtitle: "Great Barrier",    color: "#006d77", accent: "#83c5be" },
]

function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16)
  const r = Math.max(0, (num >> 16) - percent)
  const g = Math.max(0, ((num >> 8) & 0x00ff) - percent)
  const b = Math.max(0, (num & 0x0000ff) - percent)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`
}

export default function Carousel3D() {
  const [angle, setAngle] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const dragRef = useRef({ startX: 0, startAngle: 0 })
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // Auto-rotation loop
  useEffect(() => {
    if (!autoRotate || isDragging) return
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp
      setAngle((prev) => prev + AUTO_SPEED * delta * 0.06)
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTimeRef.current = null
    }
  }, [autoRotate, isDragging])

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      setIsDragging(true)
      const x = "touches" in e ? e.touches[0].clientX : e.clientX
      dragRef.current = { startX: x, startAngle: angle }
    },
    [angle],
  )

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX
      const delta = (x - dragRef.current.startX) * 0.008
      setAngle(dragRef.current.startAngle + delta)
    },
    [isDragging],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return
    window.addEventListener("mousemove", handlePointerMove)
    window.addEventListener("mouseup", handlePointerUp)
    window.addEventListener("touchmove", handlePointerMove, { passive: true })
    window.addEventListener("touchend", handlePointerUp)
    return () => {
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("mouseup", handlePointerUp)
      window.removeEventListener("touchmove", handlePointerMove)
      window.removeEventListener("touchend", handlePointerUp)
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  const getCardStyle = (index: number): React.CSSProperties => {
    const theta = angle + (index / CARD_COUNT) * Math.PI * 2
    const x = Math.sin(theta) * RADIUS
    const z = Math.cos(theta) * RADIUS
    const normalizedZ = (z + RADIUS) / (2 * RADIUS)
    const scale = 0.5 + normalizedZ * 0.6
    const opacity = 0.15 + normalizedZ * 0.85
    const zIndex = Math.round(normalizedZ * 100)
    const rotateY = -theta * (180 / Math.PI) * 0.15
    return {
      transform: `translate3d(${x}px, 0, ${z}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity,
      zIndex,
      pointerEvents: normalizedZ > 0.7 ? "auto" : "none",
      transition: isDragging ? "none" : "transform 0.1s ease-out, opacity 0.1s ease-out",
    }
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
      `}</style>

      <h1 style={styles.title}>
        <span style={styles.titleLight}>3D</span> Carousel
      </h1>
      <p style={styles.subtitle}>drag to explore · auto-rotating</p>

      <div
        ref={containerRef}
        style={{ ...styles.scene, cursor: isDragging ? "grabbing" : "grab" }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div style={styles.track}>
          {CARDS.map((card, i) => (
            <div key={i} style={{ ...styles.cardWrapper, ...getCardStyle(i) }}>
              <div
                style={{
                  ...styles.card,
                  background: `linear-gradient(145deg, ${card.color} 0%, ${darken(card.color, 30)} 100%)`,
                }}
              >
                <div style={{ ...styles.blob, background: card.accent, top: "15%", right: "10%", width: 80, height: 80, opacity: 0.2 }} />
                <div style={{ ...styles.blob, background: card.accent, bottom: "20%", left: "-5%", width: 120, height: 120, opacity: 0.12 }} />
                <div style={{ ...styles.cardNumber, color: card.accent + "44" }}>{String(i + 1).padStart(2, "0")}</div>
                <div style={styles.cardContent}>
                  <div style={{ ...styles.tag, background: card.accent + "33", color: card.accent }}>{card.subtitle}</div>
                  <h2 style={{ ...styles.cardTitle, color: "#fff" }}>{card.title}</h2>
                  <div style={styles.cardBar}>
                    <div style={{ ...styles.cardBarFill, background: card.accent, width: `${60 + i * 5}%` }} />
                  </div>
                </div>
                <div style={styles.shine} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.controls}>
        <button
          style={{
            ...styles.controlBtn,
            background: autoRotate ? "#fff" : "transparent",
            color: autoRotate ? "#1a1a2e" : "#8a8a9e",
          }}
          onClick={() => setAutoRotate((v) => !v)}
        >
          {autoRotate ? "⏸ Pause" : "▶ Play"}
        </button>
      </div>

      <div style={styles.floor} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Outfit', sans-serif",
    overflow: "hidden",
    position: "relative",
    userSelect: "none",
  },
  title: { fontSize: 36, fontWeight: 700, color: "#fff", letterSpacing: -1, marginBottom: 6, zIndex: 10 },
  titleLight: { fontWeight: 300, opacity: 0.5 },
  subtitle: { fontSize: 13, color: "#6a6a8e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 40, zIndex: 10 },
  scene: {
    position: "relative",
    width: "100%",
    maxWidth: 700,
    height: 340,
    perspective: "1200px",
    perspectiveOrigin: "50% 45%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  track: { position: "relative", width: 0, height: 0, transformStyle: "preserve-3d" },
  cardWrapper: { position: "absolute", left: -110, top: -140, width: 220, height: 280, transformStyle: "preserve-3d" },
  card: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)",
    backfaceVisibility: "hidden",
  },
  blob: { position: "absolute", borderRadius: "50%", filter: "blur(20px)" },
  cardNumber: { position: "absolute", top: 16, right: 18, fontSize: 64, fontWeight: 700, lineHeight: 1 },
  cardContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 22px" },
  tag: { display: "inline-block", fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 20, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  cardTitle: { fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 12, lineHeight: 1.2 },
  cardBar: { width: "100%", height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" },
  cardBarFill: { height: "100%", borderRadius: 2, opacity: 0.6, transition: "width 0.3s ease" },
  shine: { position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)", pointerEvents: "none" },
  controls: { marginTop: 36, zIndex: 10 },
  controlBtn: { border: "1px solid rgba(255,255,255,0.15)", borderRadius: 24, padding: "8px 24px", fontSize: 13, fontFamily: "'Outfit', sans-serif", fontWeight: 500, cursor: "pointer", letterSpacing: 1, transition: "all 0.2s ease" },
  floor: { position: "absolute", bottom: 0, left: 0, right: 0, height: "20%", background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.02) 100%)", pointerEvents: "none" },
}
