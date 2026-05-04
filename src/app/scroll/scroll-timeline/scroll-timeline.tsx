"use client"

import { useEffect, useRef } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

const AUTO_SECTIONS = [
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
]

const SCRUB_SECTION = {
  index: "03",
  title: "Scrub to feel",
  subtitle: "When the scroll position IS the animation",
}

const STATS = [
  { value: 100, label: "scroll progress" },
  { value: 60, label: "fps locked" },
  { value: 0, label: "jank frames" },
]

const H_PANELS = [
  { index: "A", heading: "Horizontal", sub: "Vertical scroll drives lateral motion" },
  { index: "B", heading: "Momentum", sub: "Four panels — one continuous gesture" },
  { index: "C", heading: "Sync", sub: "Each panel fires its own entrance timeline" },
  { index: "D", heading: "Complete", sub: "Lenis + GSAP, end to end" },
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
      // --- Auto-play entrance sections ---
      const autoSections = containerRef.current?.querySelectorAll<HTMLElement>(
        ".js-section-auto"
      )
      autoSections?.forEach((section) => {
        const title = section.querySelector(".js-title")
        const subtitle = section.querySelector(".js-subtitle")
        const line = section.querySelector(".js-line")

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          })
          .fromTo(
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

      // --- Scrub section ---
      const scrubSection =
        containerRef.current?.querySelector<HTMLElement>(".js-section-scrub")
      if (scrubSection) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: scrubSection,
              start: "top 80%",
              end: "center center",
              scrub: 1.5,
            },
          })
          .fromTo(
            scrubSection.querySelector(".js-title"),
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1 }
          )
          .fromTo(
            scrubSection.querySelector(".js-subtitle"),
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1 },
            "<0.3"
          )
          .fromTo(
            scrubSection.querySelector(".js-line"),
            { scaleX: 0, transformOrigin: "left center" },
            { scaleX: 1 },
            "<0.3"
          )
      }

      // --- Phase 4: Pin section with scroll-driven counter + text swap ---
      const pinSection =
        containerRef.current?.querySelector<HTMLElement>(".js-pin-section")
      if (pinSection) {
        const counterEl = pinSection.querySelector<HTMLElement>(".js-counter")
        const textEls =
          pinSection.querySelectorAll<HTMLElement>(".js-swap-text")

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinSection,
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        })

        // Counter 0 → 100
        const obj = { val: 0 }
        tl.to(
          obj,
          {
            val: 100,
            duration: 1,
            ease: "none",
            onUpdate() {
              if (counterEl)
                counterEl.textContent = String(Math.round(obj.val)).padStart(
                  3,
                  "0"
                )
            },
          },
          0
        )

        // Text lines cycle through three states
        tl.set(textEls[0], { opacity: 1 }, 0)
          .set(textEls[1], { opacity: 0 }, 0)
          .set(textEls[2], { opacity: 0 }, 0)
          .to(textEls[0], { opacity: 0, duration: 0.1 }, 0.3)
          .to(textEls[1], { opacity: 1, duration: 0.1 }, 0.3)
          .to(textEls[1], { opacity: 0, duration: 0.1 }, 0.6)
          .to(textEls[2], { opacity: 1, duration: 0.1 }, 0.6)
      }

      // --- Phase 5: Horizontal scroll driven by vertical scroll ---
      const hTrack =
        containerRef.current?.querySelector<HTMLElement>(".js-h-track")
      const hWrapper =
        containerRef.current?.querySelector<HTMLElement>(".js-h-wrapper")
      if (hTrack && hWrapper) {
        const totalShift = hTrack.scrollWidth - hWrapper.offsetWidth

        const hTl = gsap.timeline({
          scrollTrigger: {
            trigger: hWrapper,
            start: "top top",
            end: () => `+=${totalShift}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        })

        hTl.to(hTrack, { x: -totalShift, ease: "none" })

        // Panel entrance: when each panel is centred in the viewport
        const panels = hTrack.querySelectorAll<HTMLElement>(".js-h-panel")
        panels.forEach((panel, i) => {
          if (i === 0) return // first panel visible from start
          const panelTitle = panel.querySelector(".js-panel-title")
          const panelSub = panel.querySelector(".js-panel-sub")

          gsap
            .timeline({
              scrollTrigger: {
                trigger: hWrapper,
                start: () => `top top+=${(totalShift / panels.length) * i - 80}`,
                end: () => `top top+=${(totalShift / panels.length) * i + 100}`,
                scrub: 0.8,
                invalidateOnRefresh: true,
              },
            })
            .fromTo(panelTitle, { y: 30, opacity: 0 }, { y: 0, opacity: 1 })
            .fromTo(
              panelSub,
              { y: 15, opacity: 0 },
              { y: 0, opacity: 1 },
              "<0.2"
            )
        })
      }

      // --- Stats entrance after pin ---
      const statItems =
        containerRef.current?.querySelectorAll<HTMLElement>(".js-stat")
      statItems?.forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: i * 0.15,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        )
      })
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

      {/* Auto-play sections */}
      {AUTO_SECTIONS.map(({ index, title, subtitle }) => (
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

      {/* Scrub section */}
      <section className="js-section-scrub flex h-screen flex-col justify-center px-[10vw] border-b border-white/5">
        <span className="mb-6 font-mono text-xs text-[#444444] tracking-widest">
          {SCRUB_SECTION.index}
        </span>
        <h2 className="js-title mb-4 text-5xl font-bold text-white leading-tight">
          {SCRUB_SECTION.title}
        </h2>
        <p className="js-subtitle mb-8 text-lg text-[#888888] max-w-md">
          {SCRUB_SECTION.subtitle}
        </p>
        <div className="js-line h-px w-48 bg-white/20" />
      </section>

      {/* Phase 4: Pinned section */}
      <section className="js-pin-section flex h-screen flex-col items-center justify-center border-b border-white/5 bg-[#111111]">
        <span className="mb-4 font-mono text-xs text-[#444444] tracking-widest">
          04 — pin
        </span>
        <div className="js-counter font-mono text-[12rem] font-bold leading-none text-white tabular-nums">
          000
        </div>
        <div className="relative mt-6 h-6 overflow-hidden">
          <p className="js-swap-text absolute font-mono text-sm text-[#888888]">
            initializing scroll engine...
          </p>
          <p className="js-swap-text absolute font-mono text-sm text-[#888888]">
            tracking position in real time...
          </p>
          <p className="js-swap-text absolute font-mono text-sm text-[#888888]">
            scroll complete — frame perfect.
          </p>
        </div>
      </section>

      {/* Stats after pin */}
      <section className="flex h-screen items-center justify-center gap-24 border-b border-white/5">
        {STATS.map(({ value, label }) => (
          <div key={label} className="js-stat flex flex-col items-center gap-2">
            <span className="font-mono text-5xl font-bold text-white">
              {value}
            </span>
            <span className="font-mono text-xs text-[#666666] tracking-widest uppercase">
              {label}
            </span>
          </div>
        ))}
      </section>

      {/* Phase 5: Horizontal scroll wrapper */}
      <div className="js-h-wrapper overflow-hidden" style={{ height: "100vh" }}>
        <div
          className="js-h-track flex"
          style={{ width: `${H_PANELS.length * 100}vw`, willChange: "transform" }}
        >
          {H_PANELS.map(({ index, heading, sub }) => (
            <div
              key={index}
              className="js-h-panel flex h-screen w-screen flex-col items-center justify-center border-r border-white/5 bg-[#0D0D0D]"
            >
              <span className="mb-4 font-mono text-xs text-[#444444] tracking-widest">
                05 — {index}
              </span>
              <h2 className="js-panel-title mb-3 text-6xl font-bold text-white">
                {heading}
              </h2>
              <p className="js-panel-sub font-mono text-sm text-[#666666] max-w-xs text-center">
                {sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer spacer */}
      <section className="h-screen flex items-center justify-center">
        <p className="font-mono text-xs text-[#333333] tracking-widest uppercase">
          end of phase 5
        </p>
      </section>
    </main>
  )
}
