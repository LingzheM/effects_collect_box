"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type React from "react"

const PAPER_HEIGHT = 360
const PRINT_DURATION = 2000

// Fixed widths to avoid Math.random() hydration mismatch
const BARCODE_WIDTHS = [2,1,1,2,1,2,1,1,2,2,1,2,1,2,1,1,2,1,2,2,1,1,2,1,2,1,2,1,1,2]

type Phase = "idle" | "printing" | "printed" | "tearing" | "torn"

export default function ReceiptPrinter() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [paperProgress, setPaperProgress] = useState(0)
  const [tearOffset, setTearOffset] = useState(0)
  const [tornPapers, setTornPapers] = useState<{ id: number }[]>([])
  const [dragStart, setDragStart] = useState<number | null>(null)
  const paperRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const animatePrint = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp
    const elapsed = timestamp - startTimeRef.current
    const progress = Math.min(elapsed / PRINT_DURATION, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    setPaperProgress(eased)

    if (progress < 1) {
      animRef.current = requestAnimationFrame(animatePrint)
    } else {
      setPhase("printed")
    }
  }, [])

  const handlePrinterClick = useCallback(() => {
    if (phase !== "idle") return
    setPhase("printing")
    setPaperProgress(0)
    setTearOffset(0)
    startTimeRef.current = null
    animRef.current = requestAnimationFrame(animatePrint)
  }, [phase, animatePrint])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== "printed") return
    e.preventDefault()
    const y = "touches" in e ? e.touches[0].clientY : e.clientY
    setDragStart(y)
    setPhase("tearing")
  }, [phase])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (phase !== "tearing" || dragStart === null) return
    e.preventDefault()
    const y = "touches" in e ? e.touches[0].clientY : e.clientY
    const delta = Math.max(0, y - dragStart)
    setTearOffset(delta)
  }, [phase, dragStart])

  const handleDragEnd = useCallback(() => {
    if (phase !== "tearing") return
    if (tearOffset > 60) {
      setTornPapers((prev) => [...prev, { id: Date.now() }])
      setPhase("idle")
      setPaperProgress(0)
      setTearOffset(0)
    } else {
      setTearOffset(0)
      setPhase("printed")
    }
    setDragStart(null)
  }, [phase, tearOffset])

  useEffect(() => {
    if (phase === "tearing") {
      window.addEventListener("mousemove", handleDragMove)
      window.addEventListener("mouseup", handleDragEnd)
      window.addEventListener("touchmove", handleDragMove, { passive: false })
      window.addEventListener("touchend", handleDragEnd)
      return () => {
        window.removeEventListener("mousemove", handleDragMove)
        window.removeEventListener("mouseup", handleDragEnd)
        window.removeEventListener("touchmove", handleDragMove)
        window.removeEventListener("touchend", handleDragEnd)
      }
    }
  }, [phase, handleDragMove, handleDragEnd])

  const currentPaperHeight = PAPER_HEIGHT * paperProgress
  const tearThreshold = tearOffset > 60

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      <div style={styles.scene}>
        <div
          style={{ ...styles.printerWrap, cursor: phase === "idle" ? "pointer" : "default" }}
          onClick={handlePrinterClick}
        >
          <div style={styles.printerBox}>
            <div style={styles.front} />
            <div style={styles.top} />
            <div style={styles.right} />
            <div style={styles.slit} />
            <div
              style={{
                ...styles.led,
                background: phase === "printing" ? "#4ade80" : phase === "idle" ? "#94a3b8" : "#f59e0b",
                boxShadow: phase === "printing" ? "0 0 8px #4ade80" : "none",
              }}
            />
          </div>

          {phase === "idle" && tornPapers.length === 0 && (
            <div style={styles.prompt}>tap to print</div>
          )}

          {(phase === "printing" || phase === "printed" || phase === "tearing") && (
            <div
              ref={paperRef}
              style={{
                ...styles.paper,
                height: currentPaperHeight,
                transform: `translateY(${tearOffset}px)`,
                opacity: tearThreshold ? 1 - (tearOffset - 60) / 100 : 1,
                transition: phase === "tearing" ? "none" : undefined,
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <div style={styles.paperContent}>
                {phase !== "printing" && (
                  <>
                    <div style={styles.receiptHeader}>RECEIPT</div>
                    <div style={styles.dottedLine} />
                    <div style={styles.receiptDate}>
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div style={styles.dottedLine} />
                    <div style={styles.receiptBody}>
                      <div style={styles.lineItem}><span>HELLO WORLD</span><span>----</span></div>
                      <div style={styles.lineItem}><span>THIS IS YOUR</span><span>----</span></div>
                      <div style={styles.lineItem}><span>FIRST RECEIPT</span><span>----</span></div>
                    </div>
                    <div style={styles.dottedLine} />
                    <div style={styles.receiptFooter}>
                      <div style={styles.lineItem}><span>TOTAL</span><span>$0.00</span></div>
                    </div>
                    <div style={styles.dottedLine} />
                    <div style={styles.barcode}>
                      {BARCODE_WIDTHS.map((w, i) => (
                        <div key={i} style={{ width: w, height: 28, background: "#1e293b", marginRight: 1 }} />
                      ))}
                    </div>
                    <div style={styles.thankyou}>THANK YOU!</div>
                  </>
                )}
              </div>

              {phase === "printed" && (
                <div style={styles.tearHint}>
                  <div style={styles.tearArrow}>↓</div>
                  <span>pull to tear</span>
                </div>
              )}

              <svg style={styles.jaggedEdge} viewBox="0 0 200 12" preserveAspectRatio="none">
                <path
                  d="M0,0 L5,8 L10,2 L15,10 L20,1 L25,9 L30,3 L35,8 L40,1 L45,10 L50,2 L55,9 L60,3 L65,8 L70,1 L75,10 L80,2 L85,9 L90,3 L95,7 L100,1 L105,10 L110,2 L115,8 L120,3 L125,9 L130,1 L135,8 L140,2 L145,10 L150,3 L155,9 L160,1 L165,8 L170,2 L175,10 L180,3 L185,9 L190,1 L195,8 L200,2 L200,12 L0,12 Z"
                  fill="#fafaf9"
                />
              </svg>
            </div>
          )}
        </div>

        {tornPapers.map((paper, index) => (
          <div
            key={paper.id}
            style={{
              ...styles.tornPaper,
              opacity: 0.6 + index * 0.1,
              transform: `rotate(${(index % 2 === 0 ? 1 : -1) * (1 + index * 0.5)}deg)`,
            }}
          >
            <div style={styles.tornPaperInner}>
              <div style={styles.receiptHeader}>RECEIPT</div>
              <div style={styles.dottedLine} />
              <div style={styles.receiptBody}>
                <div style={styles.lineItem}><span>HELLO WORLD</span><span>----</span></div>
              </div>
              <div style={styles.dottedLine} />
              <div style={styles.thankyou}>THANK YOU!</div>
            </div>
          </div>
        ))}
      </div>

      {phase === "printing" && (
        <div style={styles.printingIndicator}>
          {[0, 200, 400].map((delay) => (
            <div key={delay} style={{ ...styles.dot, animationDelay: `${delay}ms` }} />
          ))}
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f1f5f9 0%, #e8ecf1 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "10vh",
    fontFamily: "'Space Mono', monospace",
    userSelect: "none",
    overflow: "auto",
  },
  scene: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
    padding: "0 20px",
  },
  printerWrap: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    perspective: "800px",
  },
  printerBox: {
    position: "relative",
    width: 240,
    height: 80,
    transformStyle: "preserve-3d",
    transform: "rotateX(-12deg) rotateY(-5deg)",
  },
  front: {
    position: "absolute",
    width: 240,
    height: 80,
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 60%, #f1f5f9 100%)",
    borderRadius: 8,
    boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  top: {
    position: "absolute",
    width: 240,
    height: 40,
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    transform: "rotateX(90deg) translateZ(0px) translateY(-20px)",
    transformOrigin: "top",
    borderRadius: "8px 8px 0 0",
    boxShadow: "inset 0 0 12px rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.03)",
  },
  right: {
    position: "absolute",
    width: 40,
    height: 80,
    background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%)",
    transform: "rotateY(90deg) translateZ(220px) translateX(-20px)",
    transformOrigin: "right",
    borderRadius: "0 8px 8px 0",
    boxShadow: "inset 0 0 8px rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.03)",
  },
  slit: {
    position: "absolute",
    bottom: -2,
    left: 30,
    width: 180,
    height: 4,
    background: "linear-gradient(180deg, #94a3b8, #64748b)",
    borderRadius: 2,
    boxShadow: "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 2px rgba(0,0,0,0.2)",
    zIndex: 10,
  },
  led: {
    position: "absolute",
    top: 16,
    right: 24,
    width: 6,
    height: 6,
    borderRadius: "50%",
    transition: "all 0.3s ease",
    zIndex: 5,
  },
  prompt: {
    marginTop: 24,
    fontSize: 12,
    color: "#94a3b8",
    letterSpacing: 2,
    textTransform: "uppercase",
    animation: "pulse 2s ease-in-out infinite",
  },
  paper: {
    position: "relative",
    width: 180,
    background: "#fafaf9",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08), 2px 0 4px rgba(0,0,0,0.03)",
    overflow: "hidden",
    cursor: "grab",
    zIndex: 5,
    borderLeft: "1px solid rgba(0,0,0,0.04)",
    borderRight: "1px solid rgba(0,0,0,0.04)",
  },
  paperContent: { padding: "12px 14px" },
  receiptHeader: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 4,
    color: "#1e293b",
    padding: "4px 0 8px",
  },
  receiptDate: {
    textAlign: "center",
    fontSize: 9,
    color: "#64748b",
    padding: "6px 0",
    letterSpacing: 0.5,
  },
  dottedLine: { borderBottom: "1.5px dashed #cbd5e1", margin: "6px 0" },
  receiptBody: { padding: "4px 0" },
  lineItem: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#334155",
    padding: "3px 0",
    letterSpacing: 0.5,
  },
  receiptFooter: { padding: "4px 0" },
  barcode: { display: "flex", justifyContent: "center", padding: "8px 0 4px", gap: 0 },
  thankyou: {
    textAlign: "center",
    fontSize: 10,
    color: "#64748b",
    letterSpacing: 3,
    padding: "8px 0 4px",
  },
  jaggedEdge: { position: "absolute", bottom: -10, left: 0, width: "100%", height: 12 },
  tearHint: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    paddingTop: 8,
    paddingBottom: 4,
    fontSize: 9,
    color: "#94a3b8",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  tearArrow: { fontSize: 14, animation: "bounce 1s ease-in-out infinite", color: "#94a3b8" },
  tornPaper: {
    width: 180,
    background: "#fafaf9",
    padding: "8px 14px",
    marginTop: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    borderRadius: "0 0 2px 2px",
    animation: "fadeInDown 0.4s ease-out",
    borderLeft: "1px solid rgba(0,0,0,0.04)",
    borderRight: "1px solid rgba(0,0,0,0.04)",
  },
  tornPaperInner: { opacity: 0.8 },
  printingIndicator: {
    position: "fixed",
    bottom: 40,
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#94a3b8",
    animation: "dotPulse 1s ease-in-out infinite",
  },
}
