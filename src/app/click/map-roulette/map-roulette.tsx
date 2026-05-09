"use client"

import { useRef, useLayoutEffect, useEffect, useState, useCallback } from "react"
import { COUNTRIES } from "./countries"

// ── Layout constants ──────────────────────────────────────────────────────────
const ITEM_H = 44             // px per list item
const VISIBLE = 9             // visible items (odd → clean center row)
const CONTAINER_H = VISIBLE * ITEM_H  // 396px

// ── Infinite-scroll constants ─────────────────────────────────────────────────
// The list is rendered COPIES times stacked vertically.
// We start at START_COPY and land at LAND_COPY, giving ≥ 4 full rotations.
// After each spin we silently reset to START_COPY (same visual position).
const COPIES = 10
const START_COPY = 4
const LAND_COPY = 9

// ── Animation ─────────────────────────────────────────────────────────────────
const DURATION = 2400  // ms

// Starts fast, decelerates sharply — ideal for slot-machine feel.
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// translateY that places item `idx` of copy `copy` at the center of the container.
function yFor(n: number, copy: number, idx: number): number {
  return -(copy * n + idx) * ITEM_H + CONTAINER_H / 2 - ITEM_H / 2
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapRoulette() {
  const trackRef = useRef<HTMLDivElement>(null)
  const blurRef  = useRef<HTMLDivElement>(null)
  const posRef   = useRef(0)          // current translateY (managed imperatively)
  const rafRef   = useRef<number | null>(null)
  const spinningRef = useRef(false)   // avoids closure-stale isSpinning checks

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [spinning, setSpinning]       = useState(false)

  const n = COUNTRIES.length

  // Set initial scroll position synchronously (prevents flash of wrong position).
  useLayoutEffect(() => {
    const y = yFor(n, START_COPY, 0)
    posRef.current = y
    if (trackRef.current) trackRef.current.style.transform = `translateY(${y}px)`
  }, [n])

  // Cleanup RAF on unmount.
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])

  const spin = useCallback(() => {
    if (spinningRef.current) return
    spinningRef.current = true
    setSpinning(true)
    setSelectedIdx(null)

    const targetIdx = Math.floor(Math.random() * n)
    const startY    = posRef.current
    const endY      = yFor(n, LAND_COPY, targetIdx)
    const dist      = endY - startY   // large negative: we scroll upward
    const t0        = performance.now()

    function frame(now: number) {
      const t    = Math.min((now - t0) / DURATION, 1)
      const pos  = startY + dist * easeOutExpo(t)

      posRef.current = pos
      if (trackRef.current) {
        trackRef.current.style.transform = `translateY(${pos}px)`
      }

      // Motion blur: maximum at start, gone by t = 0.72.
      // Applied to the clipped inner wrapper so the blur is contained within
      // the list bounds and does not bleed past the fades.
      if (blurRef.current) {
        const blur = t < 0.72 ? 3.5 * (1 - t / 0.72) : 0
        blurRef.current.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : ""
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }

      // Animation complete ── silently reset to START_COPY equivalent.
      // The content at (START_COPY, targetIdx) is visually identical to
      // (LAND_COPY, targetIdx), so the teleport is invisible.
      const resetY = yFor(n, START_COPY, targetIdx)
      posRef.current = resetY
      if (trackRef.current) trackRef.current.style.transform = `translateY(${resetY}px)`
      if (blurRef.current)  blurRef.current.style.filter = ""

      setSelectedIdx(targetIdx)
      setSpinning(false)
      spinningRef.current = false
    }

    rafRef.current = requestAnimationFrame(frame)
  }, [n])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-8">

      {/* ── List container ── */}
      <div
        className="relative overflow-hidden rounded-xl bg-[#1A1A1A]"
        style={{ height: CONTAINER_H, width: 300 }}
      >
        {/* Blur wrapper — receives filter: blur() during fast-spin phase.
            Siblings (fades, band) are outside so they stay sharp. */}
        <div ref={blurRef} className="absolute inset-0">
          <div
            ref={trackRef}
            className="absolute inset-x-0 top-0 will-change-transform"
          >
            {Array.from({ length: COPIES }, (_, copy) =>
              COUNTRIES.map((name, idx) => (
                <div
                  key={`${copy}-${idx}`}
                  style={{ height: ITEM_H }}
                  className={[
                    "flex items-center px-5 text-[13px] tracking-wide",
                    "border-l-[2px] transition-colors duration-150",
                    selectedIdx === idx && !spinning
                      ? "text-white border-[#e53935]"
                      : "text-[#424242] border-transparent",
                  ].join(" ")}
                >
                  {name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top gradient fade */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{
            height: ITEM_H * 3.5,
            background: "linear-gradient(to bottom, #1A1A1A 20%, transparent)",
          }}
        />

        {/* Bottom gradient fade */}
        <div
          className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
          style={{
            height: ITEM_H * 3.5,
            background: "linear-gradient(to top, #1A1A1A 20%, transparent)",
          }}
        />

        {/* Center selection band — hairline borders + very subtle highlight */}
        <div
          className="absolute inset-x-0 pointer-events-none z-20"
          style={{
            top: CONTAINER_H / 2 - ITEM_H / 2,
            height: ITEM_H,
            background: "rgba(255,255,255,0.015)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      </div>

      {/* ── SPIN button ── */}
      <button
        onClick={spin}
        disabled={spinning}
        className={[
          "px-12 py-3 rounded-lg",
          "text-white text-sm font-semibold tracking-[0.15em]",
          "transition-all select-none",
          "hover:brightness-110 active:scale-[0.97]",
          "disabled:opacity-40 disabled:cursor-not-allowed",
        ].join(" ")}
        style={{ background: "#1A6EFF" }}
      >
        {spinning ? "SPINNING" : "SPIN"}
      </button>

      {/* ── Result display ── */}
      <div className="h-5 flex items-center">
        {selectedIdx !== null && !spinning && (
          <p className="text-[#505050] text-xs tracking-[0.2em] uppercase">
            {COUNTRIES[selectedIdx]}
          </p>
        )}
      </div>

    </div>
  )
}
