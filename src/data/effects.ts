export type Category =
  | "hover"
  | "scroll"
  | "click"
  | "page-transition"
  | "loading"
  | "background"
  | "text"
  | "layout"
  | "cursor"
  | "3d-scene"
  | "gesture"

export type Tech = "css" | "framer-motion" | "canvas" | "webgl" | "shader" | string
export type Style = "liquid-glass" | "pixel" | "gradient" | string

export type Effect = {
  slug: string
  title: string
  category: Category
  tech: Tech[]
  style?: Style[]
  element?: string
  description: string
  source?: string
  createdAt: string
}

export const effects: Effect[] = [
  {
    slug: "book-flip",
    title: "Book Flip",
    category: "hover",
    tech: ["css"],
    style: ["3d"],
    element: "book",
    description: "Pure CSS hardcover book that opens its cover on hover using 3D transforms",
    createdAt: "2026-04-26",
  },
  {
    slug: "receipt-printer",
    title: "Receipt Printer",
    category: "gesture",
    tech: ["react"],
    element: "receipt",
    description: "Tap to print, drag to tear the receipt off",
    createdAt: "2026-04-27",
  },
]

export type CardSize = "large" | "medium" | "small"

export type CategoryMeta = {
  label: string
  description: string
  size: CardSize
}

export const categoryMeta: Record<Category, CategoryMeta> = {
  hover: { label: "Hover", description: "鼠标悬停触发，放上去变，移走恢复", size: "large" },
  scroll: { label: "Scroll", description: "滚动驱动，视差、渐入渐出、进度跟随", size: "large" },
  background: { label: "Background", description: "无需交互自动播放的装饰性效果", size: "large" },
  click: { label: "Click", description: "明确点击触发", size: "medium" },
  text: { label: "Text", description: "文字相关动效", size: "medium" },
  "page-transition": { label: "Page Transition", description: "路由级页面切换过渡", size: "medium" },
  loading: { label: "Loading", description: "等待状态", size: "small" },
  layout: { label: "Layout", description: "元素位置变化动画", size: "small" },
  cursor: { label: "Cursor", description: "光标相关", size: "small" },
  "3d-scene": { label: "3D Scene", description: "三维空间场景", size: "small" },
  gesture: { label: "Gesture", description: "手势驱动", size: "small" },
}

// Ordered for CSS Grid auto-placement: large → medium → small
export const categoryOrder: Category[] = [
  "hover",
  "scroll",
  "background",
  "click",
  "text",
  "page-transition",
  "loading",
  "layout",
  "cursor",
  "3d-scene",
  "gesture",
]
