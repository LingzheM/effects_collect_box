import fs from "node:fs"
import path from "node:path"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { effects } from "@/data/effects"
import { EffectBackLink } from "./back-link"

const EFFECTS_DIR = path.join(process.cwd(), "src", "effects")

// An effect is "migrated" iff src/effects/<slug>/ exists. Convention over registry:
// the filesystem is the only place that records which effects this route serves.
function migratedSlugs(): Set<string> {
  try {
    return new Set(
      fs
        .readdirSync(EFFECTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name),
    )
  } catch {
    return new Set()
  }
}

export function generateStaticParams() {
  const migrated = migratedSlugs()
  return effects
    .filter((e) => migrated.has(e.slug))
    .map((e) => ({ category: e.category, slug: e.slug }))
}

type Props = { params: Promise<{ category: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const effect = effects.find((e) => e.slug === slug)
  return { title: effect ? `${effect.title} — Effects Shelf` : "Effects Shelf" }
}

export default async function EffectPage({ params }: Props) {
  const { category, slug } = await params
  const effect = effects.find((e) => e.slug === slug && e.category === category)
  if (!effect || !migratedSlugs().has(slug)) notFound()

  const mod = await import(`../../../effects/${slug}`)
  const Effect = mod.default as React.ComponentType

  return (
    <>
      <Effect />
      <EffectBackLink category={category} />
    </>
  )
}
