import { effects, categoryMeta, categoryOrder } from "@/data/effects"
import { EffectCard } from "./effect-card"

// Palette from color_card/color/color.md
const BENTO_COLORS = [
  "#044B66", // FRESCO BLUE
  "#09799E", // MITCHELL BLUE
  "#021F2E", // OXFORD BY NIGHT
  "#47A9CF", // MYSTIC BLUE
  "#A6E0F4", // VANGOGH BLUE
]

// Shuffled index sequence so adjacent cards get different hues
const COLOR_SEQUENCE = [2, 0, 3, 1, 4, 2, 4, 0, 3, 1, 0]

export function BentoGrid() {
  return (
    <div className="grid grid-cols-4 auto-rows-[200px] gap-3">
      {categoryOrder.map((category, i) => {
        const meta = categoryMeta[category]
        const count = effects.filter((e) => e.category === category).length
        const spanClass =
          meta.size === "large"
            ? "col-span-2 row-span-2"
            : meta.size === "medium"
              ? "col-span-2"
              : ""
        const accentColor = BENTO_COLORS[COLOR_SEQUENCE[i] ?? i % BENTO_COLORS.length]

        return (
          <div key={category} className={spanClass}>
            <EffectCard
              category={category}
              label={meta.label}
              description={meta.description}
              size={meta.size}
              count={count}
              accentColor={accentColor}
            />
          </div>
        )
      })}
    </div>
  )
}
