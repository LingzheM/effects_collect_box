import { TransitionLink } from "@/components/transition-link"
import type { Category, CardSize } from "@/data/effects"

type Props = {
  category: Category
  label: string
  description: string
  size: CardSize
  count: number
}

export function EffectCard({ category, label, description, size, count }: Props) {
  return (
    <TransitionLink
      href={`/${category}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white transition-all hover:border-zinc-200 hover:shadow-md"
      style={{ viewTransitionName: `card-${category}` }}
    >
      <div
        className="flex-1"
        style={{
          backgroundImage: "radial-gradient(#e4e4e7 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="border-t border-zinc-100 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-zinc-800">{label}</span>
          <span className="shrink-0 tabular-nums text-xs text-zinc-400">{count}</span>
        </div>
        {size !== "small" && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">{description}</p>
        )}
      </div>
    </TransitionLink>
  )
}
