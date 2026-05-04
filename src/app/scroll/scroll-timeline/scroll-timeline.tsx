"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function ScrollTimeline() {
  useEffect(() => {
    // Phase 1 verification: both libraries imported and registered
    console.log("Lenis:", Lenis)
    console.log("GSAP:", gsap.version)
    console.log("ScrollTrigger:", ScrollTrigger)
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
      <p className="text-[#888888] font-mono text-sm">
        gsap {"{"}version{"}"} + lenis — libraries confirmed
      </p>
    </main>
  )
}
