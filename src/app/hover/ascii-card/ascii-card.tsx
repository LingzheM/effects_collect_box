"use client"

import { useEffect, useRef } from "react"

const CHARS = " .,:;+x#%@"

const CW = 7.5
const CH = 13
const COLS = 54
const ROWS = 24

export default function AsciiCard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hovered = useRef(false)
  const raf = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = Math.ceil(COLS * CW)
    canvas.height = ROWS * CH

    ctx.font = `12px "Courier New", monospace`
    ctx.textBaseline = "top"

    let t = 0

    function frame() {
      ctx!.fillStyle = "#0d0d0d"
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      t += hovered.current ? 0.055 : 0.02

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const nx = (col / (COLS - 1)) * 2 - 1
          const ny = (row / (ROWS - 1)) * 2 - 1

          // Ellipse shape (slightly wider than tall)
          const dist = Math.sqrt((nx / 1.15) ** 2 + ny ** 2)
          const inSphere = dist < 1

          // Layered sine-wave field
          const w =
            Math.sin(nx * 3.5 + t * 1.6) * 0.35 +
            Math.sin(ny * 4.0 - t * 1.3) * 0.35 +
            Math.sin((nx - ny) * 2.8 + t * 0.9) * 0.2 +
            Math.sin(dist * 7 - t * 2.2) * 0.1

          let b: number
          if (inSphere) {
            b = (1 - dist) * 0.55 + w * 0.45
          } else {
            b = Math.max(0, w * 0.07)
          }

          b = Math.max(0, Math.min(1, b))
          const charIdx = Math.floor(b * (CHARS.length - 1))
          const ch = CHARS[charIdx]
          if (ch === " ") continue

          // Purple-to-white inside the sphere, dim gray outside
          let r: number, g: number, bl: number
          if (inSphere) {
            r = Math.floor(80 + b * 170)
            g = Math.floor(40 + b * 110)
            bl = Math.floor(180 + b * 75)
          } else {
            const v = Math.floor(b * 180)
            r = g = bl = v
          }

          ctx!.fillStyle = `rgb(${r},${g},${bl})`
          ctx!.fillText(ch, col * CW, row * CH)
        }
      }

      raf.current = requestAnimationFrame(frame)
    }

    frame()
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return (
    <div
      className="inline-block rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0d0d0d]"
      onMouseEnter={() => { hovered.current = true }}
      onMouseLeave={() => { hovered.current = false }}
    >
      <canvas ref={canvasRef} className="block" />
      <div className="px-6 py-4 border-t border-white/[0.06]">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#555]">hover</p>
        <p className="text-sm text-white/80 mt-0.5 font-medium">ASCII Card</p>
      </div>
    </div>
  )
}
