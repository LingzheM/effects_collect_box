import { effects, categoryMeta, categoryOrder } from "@/data/effects"
import { EffectCard } from "./effect-card"

export function BentoGrid() {
  return (
    <div className="grid grid-cols-4 auto-rows-[200px] gap-3">
      {categoryOrder.map((category) => {
        const meta = categoryMeta[category]
        const count = effects.filter((e) => e.category === category).length
        const spanClass =
          meta.size === "large"
            ? "col-span-2 row-span-2"
            : meta.size === "medium"
              ? "col-span-2"
              : ""

        return (
          <div key={category} className={spanClass}>
            <EffectCard
              category={category}
              label={meta.label}
              description={meta.description}
              size={meta.size}
              count={count}
            />
          </div>
        )
      })}
    </div>
  )
}
