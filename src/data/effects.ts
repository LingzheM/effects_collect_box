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
    slug: "physics-card",
    title: "Physics Card",
    category: "hover",
    tech: ["rotation"],
    style: ["physics"],
    element: "card",
    description: "physics rotation",
    createdAt: "2026-05-16",
  },
  {
    slug: "book-hover",
    title: "Book Hover",
    category: "hover",
    tech: ["framer-motion"],
    style: ["3d"],
    element: "book",
    description: "Framer Motion spring-driven boo cover that flips open on click",
    createdAt: "2026-05-14",
  },
  {
    slug: "ascii-card",
    title: "ASCII Card",
    category: "hover",
    tech: ["canvas"],
    style: ["pixel"],
    element: "card",
    description: "Canvas-rendered ASCII sphere that breathes with layered sine-wave noise; hover accelerates the animation",
    createdAt: "2026-05-13",
  },
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
  {
    slug: "3d-carousel",
    title: "3D Carousel",
    category: "gesture",
    tech: ["css"],
    element: "card",
    description: "Drag-to-rotate 3D carousel with auto-spin; drag is the core interaction",
    createdAt: "2026-04-27",
  },
  {
    slug: "burn-paper",
    title: "Burn Paper",
    category: "click",
    tech: ["webgl", "shader"],
    element: "paper",
    description: "Click anywhere to ignite; FBM noise drives a WebGL burn shader with fire-front gradient, char edge, curl deformation, and smoke/ember particles",
    createdAt: "2026-05-03",
  },
  {
    slug: "dark-ambient-env",
    title: "Dark Ambient Environment",
    category: "background",
    tech: ["webgl", "shader"],
    style: ["dark", "ambient"],
    description: "GPU-side FBM generates a dark stone-textured scene with slow UV drift and vignette; the spatial stage for other effects",
    createdAt: "2026-05-05",
  },
  {
    slug: "tomato-calendar",
    title: "Tomato Calendar",
    category: "background",
    tech: ["canvas", "matter-js"],
    element: "calendar",
    description: "Physics tomatoes rain into calendar cells; calendar cells act as physics containers",
    createdAt: "2026-04-29",
  },
  {
    slug: "scroll-timeline",
    title: "Scroll Timeline",
    category: "scroll",
    tech: ["gsap", "lenis"],
    element: "section",
    description: "滚动驱动的入场时间线，元素按编排顺序依次滑入淡入，Lenis 丝滑滚动 + GSAP ScrollTrigger 控制节奏",
    createdAt: "2026-05-04",
  },
  {
    slug: "map-roulette",
    title: "Map Roulette",
    category: "click",
    tech: ["css", "svg"],
    style: ["minimal"],
    element: "list",
    description: "老虎机式国家随机选择器：easeOutExpo 驱动列表高速旋转减速，配合 SVG 世界地图实时高亮选中国家",
    createdAt: "2026-05-09",
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
