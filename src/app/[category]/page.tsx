import { notFound } from "next/navigation"
import { TransitionLink } from "@/components/transition-link"
import { effects, categoryMeta } from "@/data/effects"
import type { Category } from "@/data/effects"

type Props = {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return Object.keys(categoryMeta).map((category) => ({ category }))
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params

  if (!(category in categoryMeta)) notFound()

  const cat = category as Category
  const meta = categoryMeta[cat]
  const list = effects.filter((e) => e.category === cat)

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="mx-auto max-w-[900px]">
        <TransitionLink href="/" className="text-xs text-zinc-400 hover:text-zinc-600">
          ← Effects Shelf
        </TransitionLink>
        <header className="mt-4 mb-8">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">{meta.label}</h1>
          <p className="mt-1 text-sm text-zinc-400">{meta.description}</p>
        </header>

        {list.length === 0 ? (
          <p className="text-sm text-zinc-400">还没有效果</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {list.map((effect) => (
              <TransitionLink
                key={effect.slug}
                href={`/${cat}/${effect.slug}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:border-zinc-200 hover:shadow-md"
              >
                <div
                  className="h-[180px]"
                  style={{
                    backgroundImage: "radial-gradient(#e4e4e7 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                  }}
                />
                <div className="border-t border-zinc-100 p-3">
                  <div className="text-sm font-semibold text-zinc-800">{effect.title}</div>
                  <p className="mt-0.5 text-xs text-zinc-400">{effect.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {effect.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </TransitionLink>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
