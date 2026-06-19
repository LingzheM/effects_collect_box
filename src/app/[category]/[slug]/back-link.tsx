"use client"

import { TransitionLink } from "@/components/transition-link"

// Minimal floating chrome over an otherwise immersive (often full-screen) effect.
export function EffectBackLink({ category }: { category: string }) {
  return (
    <TransitionLink
      href={`/${category}`}
      className="fixed left-4 top-4 z-[9999] rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/80 backdrop-blur transition-colors hover:bg-black/60 hover:text-white"
    >
      ← {category}
    </TransitionLink>
  )
}
