"use client"

import { useEffect, useRef } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const SECTIONS = [
  {
    index: "01",
    title: "Motion begins",
    subtitle: "Scroll to reveal what was always there",
  },
  {
    index: "02",
    title: "Rhythm matters",
    subtitle: "Staggered timing creates narrative weight",
  },
  {
    index: "03",
    title: "Scrub to feel",
    subtitle: "When the scroll position IS the animation",
  },
]

export default function ScrollTimeline() {
  const lenisRef = useRef<Lenis | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08 })
    lenisRef.current = lenis

    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
    lenis.on("scroll", ScrollTrigger.update)

    const ctx = gsap.context(() => {
      // --- Auto-play entrance timeline (Sections 01 & 02) ---
      const autoSections = containerRef.current?.querySelectorAll<HTMLElement>(
        ".js-section-auto"
      )
      autoSections?.forEach((section) => {
        const title = section.querySelector(".js-title")
        const subtitle = section.querySelector(".js-subtitle")
        const line = section.querySelector(".js-line")

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        })

        tl.fromTo(
          title,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
        )
          .fromTo(
            subtitle,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
            "+=0.2"
          )
          .fromTo(
            line,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1, duration: 0.6, ease: "power2.inOut" },
            "+=0.2"
          )
      })

      // --- Scrub mode (Section 03) ---
      const scrubSection =
        containerRef.current?.querySelector<HTMLElement>(".js-section-scrub")
      if (scrubSection) {
        const title = scrubSection.querySelector(".js-title")
        const subtitle = scrubSection.querySelector(".js-subtitle")
        const line = scrubSection.querySelector(".js-line")

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: scrubSection,
            start: "top 80%",
            end: "center center",
            scrub: 1.5,
          },
        })

        tl.fromTo(title, { y: 60, opacity: 0 }, { y: 0, opacity: 1 })
          .fromTo(subtitle, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, "<0.3")
          .fromTo(
            line,
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1 },
            "<0.3"
          )
      }
    }, containerRef)

    return () => {
      ctx.revert()
      gsap.ticker.remove((time) => lenis.raf(time * 1000))
      lenis.destroy()
    }
  }, [])

  return (
    <main ref={containerRef} className="bg-[#0A0A0A]">
      {/* Hero */}
      <section className="flex h-screen items-center justify-center border-b border-white/5">
        <p className="font-mono text-sm text-[#888888] tracking-widest uppercase">
          Scroll to explore ↓
        </p>
      </section>

      {/* Auto-play sections (01, 02) */}
      {SECTIONS.slice(0, 2).map(({ index, title, subtitle }) => (
        <section
          key={index}
          className="js-section-auto flex h-screen flex-col justify-center px-[10vw] border-b border-white/5"
        >
          <span className="mb-6 font-mono text-xs text-[#444444] tracking-widest">
            {index}
          </span>
          <h2 className="js-title mb-4 text-5xl font-bold text-white leading-tight">
            {title}
          </h2>
          <p className="js-subtitle mb-8 text-lg text-[#888888] max-w-md">
            {subtitle}
          </p>
          <div className="js-line h-px w-48 bg-white/20" />
        </section>
      ))}

      {/* Scrub section (03) */}
      <section className="js-section-scrub flex h-screen flex-col justify-center px-[10vw] border-b border-white/5">
        <span className="mb-6 font-mono text-xs text-[#444444] tracking-widest">
          {SECTIONS[2].index}
        </span>
        <h2 className="js-title mb-4 text-5xl font-bold text-white leading-tight">
          {SECTIONS[2].title}
        </h2>
        <p className="js-subtitle mb-8 text-lg text-[#888888] max-w-md">
          {SECTIONS[2].subtitle}
        </p>
        <div className="js-line h-px w-48 bg-white/20" />
      </section>

      {/* Spacer so scrub completes before page end */}
      <section className="h-screen flex items-center justify-center">
        <p className="font-mono text-xs text-[#333333] tracking-widest uppercase">
          end of phase 3
        </p>
      </section>
    </main>
  )
}
