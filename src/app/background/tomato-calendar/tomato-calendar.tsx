"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Matter from "matter-js"

const YEAR = 2026
const MONTH = 3 // April (0-indexed)
const FIRST_DAY = new Date(YEAR, MONTH, 1).getDay()
const DAYS_IN_MONTH = new Date(YEAR, MONTH + 1, 0).getDate()
const TODAY = 29
const TOTAL_CELLS = Math.ceil((FIRST_DAY + DAYS_IN_MONTH) / 7) * 7
const TOMATOES_PER_DAY = 3
const DROP_INTERVAL_MS = 120
const COLS = 7

type TomatoBody = Matter.Body & { circleRadius: number }

export default function TomatoCalendar() {
  const [tomatoCount, setTomatoCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)
  const tomatoesRef = useRef<TomatoBody[]>([])
  const dropIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef = useRef<number | null>(null)
  const physicsInitialized = useRef(false)

  // Build calendar cells data
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => {
    const dayNum = i - FIRST_DAY + 1
    return { index: i, dayNum, isEmpty: dayNum < 1 || dayNum > DAYS_IN_MONTH, isToday: dayNum === TODAY }
  })

  function getGridMetrics() {
    const grid = gridRef.current!
    const container = containerRef.current!
    const gridRect = grid.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const cellEls = grid.querySelectorAll<HTMLDivElement>(".cell")
    const firstCell = cellEls[0].getBoundingClientRect()
    return {
      cellW: firstCell.width,
      cellH: firstCell.height,
      gap: 3,
      offsetX: gridRect.left - containerRect.left,
      offsetY: gridRect.top - containerRect.top,
    }
  }

  function initPhysics() {
    if (physicsInitialized.current) return
    physicsInitialized.current = true

    const container = containerRef.current!
    const canvas = canvasRef.current!
    const containerRect = container.getBoundingClientRect()
    const { cellW, cellH, gap, offsetX, offsetY } = getGridMetrics()

    const cW = containerRect.width
    const cH = containerRect.height + 100

    // Retina canvas
    canvas.width = cW * 2
    canvas.height = cH * 2
    canvas.style.width = cW + "px"
    canvas.style.height = cH + "px"
    canvas.style.top = "-100px"
    canvas.style.left = "0"

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.8 } })
    engineRef.current = engine

    const rows = Math.ceil(TOTAL_CELLS / COLS)
    const wallT = 3
    const walls: Matter.Body[] = []

    // Bottom boundary
    walls.push(
      Matter.Bodies.rectangle(
        cW / 2,
        offsetY + 100 + rows * (cellH + gap) + 10,
        cW,
        20,
        { isStatic: true, label: "wall" }
      )
    )

    // Left outer wall
    walls.push(
      Matter.Bodies.rectangle(
        offsetX - 5,
        offsetY + 100 + (rows * (cellH + gap)) / 2,
        10,
        rows * (cellH + gap) + 40,
        { isStatic: true, label: "wall" }
      )
    )

    // Right outer wall
    walls.push(
      Matter.Bodies.rectangle(
        offsetX + COLS * (cellW + gap) + 5,
        offsetY + 100 + (rows * (cellH + gap)) / 2,
        10,
        rows * (cellH + gap) + 40,
        { isStatic: true, label: "wall" }
      )
    )

    // Per-row walls
    for (let row = 0; row < rows; row++) {
      const rowY = offsetY + 100 + row * (cellH + gap)

      // Row floor
      walls.push(
        Matter.Bodies.rectangle(
          offsetX + (COLS * (cellW + gap)) / 2,
          rowY + cellH + 1,
          COLS * (cellW + gap),
          wallT,
          { isStatic: true, label: "wall" }
        )
      )

      // Column dividers
      for (let col = 0; col <= COLS; col++) {
        walls.push(
          Matter.Bodies.rectangle(
            offsetX + col * (cellW + gap) - gap / 2,
            rowY + cellH / 2,
            wallT,
            cellH,
            { isStatic: true, label: "wall" }
          )
        )
      }
    }

    Matter.Composite.add(engine.world, walls)

    const runner = Matter.Runner.create()
    runnerRef.current = runner
    Matter.Runner.run(runner, engine)

    rafRef.current = requestAnimationFrame(drawLoop)
  }

  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current
    const engine = engineRef.current
    if (!canvas || !engine) return

    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(2, 2)

    for (const tomato of tomatoesRef.current) {
      const { x, y } = tomato.position
      const r = tomato.circleRadius

      const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r)
      grad.addColorStop(0, "#ff6b5a")
      grad.addColorStop(0.5, "#e04030")
      grad.addColorStop(1, "#a82818")

      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      // Highlight
      ctx.beginPath()
      ctx.arc(x - r * 0.2, y - r * 0.25, r * 0.35, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(255,255,255,0.2)"
      ctx.fill()

      // Stem
      ctx.beginPath()
      ctx.moveTo(x - 2, y - r + 1)
      ctx.quadraticCurveTo(x, y - r - 5, x + 3, y - r - 3)
      ctx.strokeStyle = "#4a7a2a"
      ctx.lineWidth = 1.8
      ctx.lineCap = "round"
      ctx.stroke()

      // Leaf
      ctx.beginPath()
      ctx.ellipse(x + 3, y - r - 2, 4, 2, 0.3, 0, Math.PI * 2)
      ctx.fillStyle = "#5a9a32"
      ctx.fill()
    }

    ctx.restore()
    rafRef.current = requestAnimationFrame(drawLoop)
  }, [])

  function getCellDropX(day: number) {
    const { cellW, cellH: _cellH, gap, offsetX, offsetY: _offsetY } = getGridMetrics()
    const idx = FIRST_DAY + day - 1
    const col = idx % COLS
    return {
      x: offsetX + col * (cellW + gap) + cellW / 2,
      cellW,
    }
  }

  function dropTomato(day: number) {
    if (!engineRef.current) return
    const { x, cellW } = getCellDropX(day)
    const radius = Math.min(cellW * 0.16, 8)
    const jitter = (Math.random() - 0.5) * cellW * 0.5

    const body = Matter.Bodies.circle(x + jitter, -20 - Math.random() * 60, radius, {
      restitution: 0.45,
      friction: 0.3,
      density: 0.002,
      frictionAir: 0.001,
    }) as TomatoBody

    Matter.Composite.add(engineRef.current.world, body)
    tomatoesRef.current.push(body)
    setTomatoCount((c) => c + 1)
  }

  const startDropping = useCallback(() => {
    if (dropIntervalRef.current) return
    let currentDay = 1
    let dropsThisDay = 0

    dropIntervalRef.current = setInterval(() => {
      if (currentDay > DAYS_IN_MONTH) {
        clearInterval(dropIntervalRef.current!)
        dropIntervalRef.current = null
        return
      }
      dropTomato(currentDay)
      dropsThisDay++
      if (dropsThisDay >= TOMATOES_PER_DAY) {
        dropsThisDay = 0
        currentDay++
      }
    }, DROP_INTERVAL_MS)
  }, [])

  const resetAll = useCallback(() => {
    if (dropIntervalRef.current) {
      clearInterval(dropIntervalRef.current)
      dropIntervalRef.current = null
    }
    if (engineRef.current) {
      for (const t of tomatoesRef.current) {
        Matter.Composite.remove(engineRef.current.world, t)
      }
    }
    tomatoesRef.current = []
    setTomatoCount(0)
  }, [])

  useEffect(() => {
    // Double rAF to ensure layout is settled before measuring cell positions
    const id1 = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        initPhysics()
      })
      return () => cancelAnimationFrame(id2)
    })
    return () => {
      cancelAnimationFrame(id1)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current)
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current)
    }
  }, [])

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Playfair+Display:wght@700;900&display=swap');
        .cell {
          aspect-ratio: 1;
          background: #ffffff;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding: 4px 6px;
          font-size: 11px;
          font-weight: 600;
          color: #2a2520;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          border: 1px solid #e8e2d8;
        }
        .cell.empty {
          background: transparent;
          border: 1px dashed rgba(0,0,0,0.06);
          box-shadow: none;
        }
        .cell.today {
          border-color: #d94032;
          box-shadow: 0 0 0 1px #d94032, 0 2px 8px rgba(217,64,50,0.12);
        }
        .cell.today .day-num { color: #d94032; font-weight: 700; }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.h1}>
          April <span style={styles.accent}>2026</span>
        </h1>
        <p style={styles.subtitle}>Tomato Tracker</p>
      </div>

      <div ref={containerRef} style={styles.calendarContainer}>
        <div style={styles.weekdays}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} style={styles.weekday}>{d}</div>
          ))}
        </div>
        <div ref={gridRef} style={styles.calendarGrid}>
          {cells.map(({ index, dayNum, isEmpty, isToday }) => (
            <div
              key={index}
              className={`cell${isEmpty ? " empty" : ""}${isToday ? " today" : ""}`}
            >
              {!isEmpty && <span className="day-num">{dayNum}</span>}
            </div>
          ))}
        </div>
        <canvas ref={canvasRef} style={styles.canvas} />
      </div>

      <div style={styles.controls}>
        <button style={styles.btnPrimary} onClick={startDropping}>Drop Tomatoes</button>
        <button style={styles.btnSecondary} onClick={resetAll}>Reset</button>
      </div>
      <div style={styles.counter}>
        Tomatoes: <span style={styles.accentBold}>{tomatoCount}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#faf7f2",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Outfit', sans-serif",
    overflow: "hidden",
  },
  header: {
    textAlign: "center",
    padding: "24px 0 12px",
    zIndex: 10,
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 900,
    color: "#2a2520",
    letterSpacing: -0.5,
  },
  accent: { color: "#d94032" },
  subtitle: {
    fontSize: 12,
    color: "#9a928a",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginTop: 4,
  },
  calendarContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 380,
    padding: "0 8px",
  },
  weekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 3,
    padding: "0 2px",
    marginBottom: 3,
  },
  weekday: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: 600,
    color: "#9a928a",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    padding: "8px 0",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 3,
    padding: "0 2px",
    position: "relative",
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    pointerEvents: "none",
    zIndex: 5,
  },
  controls: {
    display: "flex",
    gap: 10,
    marginTop: 16,
    zIndex: 10,
  },
  btnPrimary: {
    border: "none",
    padding: "10px 24px",
    borderRadius: 24,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.5,
    background: "#d94032",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(217,64,50,0.3)",
  },
  btnSecondary: {
    border: "1px solid #e8e2d8",
    padding: "10px 24px",
    borderRadius: 24,
    fontFamily: "'Outfit', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: 0.5,
    background: "#ffffff",
    color: "#2a2520",
  },
  counter: {
    marginTop: 12,
    fontSize: 12,
    color: "#9a928a",
    letterSpacing: 1,
    zIndex: 10,
  },
  accentBold: { color: "#d94032", fontWeight: 700 },
}
