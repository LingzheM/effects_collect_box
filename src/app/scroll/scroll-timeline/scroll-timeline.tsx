"use client"

import { useEffect, useRef } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const BLOCKS = [
  { bg: "#111111", label: "01" },
  { bg: "#161616", label: "02" },
  { bg: "#1A1A1A", label: "03" },
  { bg: "#111111", label: "04" },
  { bg: "#161616", label: "05" },
]

export default function ScrollTimeline() {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08 })
    lenisRef.current = lenis

    // Drive Lenis via GSAP ticker so both share the same raf loop
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    lenis.on("scroll", ScrollTrigger.update)

    return () => {
      gsap.ticker.remove((time) => lenis.raf(time * 1000))
      lenis.destroy()
    }
  }, [])

  return (
    <main className="bg-[#0A0A0A]">
      {BLOCKS.map(({ bg, label }) => (
        <section
          key={label}
          style={{ backgroundColor: bg }}
          className="flex h-screen items-center justify-center border-b border-white/5"
        >
          <span className="font-mono text-8xl font-bold text-white/10 select-none">
            {label}
          </span>
        </section>
      ))}
    </main>
  )
}
