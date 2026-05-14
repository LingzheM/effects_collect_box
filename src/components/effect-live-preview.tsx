"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

const registry: Record<string, ComponentType> = {
  "book-flip": dynamic(() =>
    import("@/app/hover/book-flip/preview").then((m) => ({ default: m.BookFlipPreview }))
  ),
}

export function EffectLivePreview({ slug }: { slug: string }) {
  const Preview = registry[slug]
  if (!Preview) return null
  return <Preview />
}
