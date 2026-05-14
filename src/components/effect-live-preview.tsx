"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

const registry: Record<string, ComponentType> = {
  "book-hover": dynamic(() =>
    import("@/app/hover/book-hover/preview").then((m) => ({ default: m.BookHoverPreview }))
  ),
}

export function EffectLivePreview({ slug }: { slug: string }) {
  const Preview = registry[slug]
  if (!Preview) return null
  return <Preview />
}
