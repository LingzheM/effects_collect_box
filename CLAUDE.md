# Effects Shelf — 项目简报

## 这个项目是什么
一个个人 UI/动效工具箱。收集、归类、展示前端视觉效果，部署在 Vercel 上，打开即可看到活的效果预览。目标用户是我自己。

## 收集范围
能在浏览器里跑起来的 UI / 动效就收，跑不起来的不收。iOS/Android 原生动画、Unity/游戏引擎不收，但用 Web 技术（Canvas + touch event 等）在浏览器中复现的效果算在内。

## 技术栈
- pnpm + React + Next.js (App Router)
- Tailwind CSS
- 部署到 Vercel

## 核心数据模型

每个效果条目包含以下字段：

```ts
type Category =
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

type Tech = "css" | "framer-motion" | "canvas" | "webgl" | "shader" | string
type Style = "liquid-glass" | "pixel" | "gradient" | string
type Element = "button" | "card" | "book" | "image" | "switch" | string

type Effect = {
  slug: string            // URL 标识，如 "book-flip"
  title: string           // 显示名，如 "Book Flip"
  category: Category      // 场景分类（唯一，必填）
  tech: Tech[]            // 技术标签（可多个）
  style?: Style[]         // 风格标签（可多个，可选）
  element?: string        // 作用载体（可选）
  description: string     // 一句话描述
  source?: string         // 来源链接（SNS 等）
  createdAt: string       // 加入日期
}
```

## 五个描述维度

| 维度 | 回答什么 | 是否必填 | 可筛选 |
|------|---------|---------|--------|
| category | 用在哪 | 是 | 是 |
| tech | 怎么做的 | 是 | 是 |
| style | 什么风格 | 否 | 是 |
| element | 作用在什么上 | 否 | 是 |
| description | 自由备注 | 是 | 否 |

## 分类体系（一级，共 11 个）

- **hover** — 鼠标悬停触发。放上去变，移走恢复。如 book flip、卡片抬起、磁吸按钮
- **scroll** — 滚动驱动。视差、渐入渐出、进度跟随、滚动固定
- **click** — 明确点击触发。按钮涟漪、手风琴、切换开关、点赞动画
- **gesture** — 连续手势驱动。滑动轨迹、拖拽跟手、双指缩放、长按、惯性滚动
- **page-transition** — 路由级页面切换过渡。渐隐、滑入、遮罩展开、共享元素动画
- **loading** — 等待状态。骨架屏、旋转器、进度条、闪烁占位
- **background** — 无需交互自动播放的装饰性效果。粒子、渐变流动、噪声、几何漂移
- **text** — 文字相关动效。逐字出现、打字机、路径文字、字体变形
- **layout** — 元素位置/尺寸变化动画。列表排序、网格重排、拖拽换位
- **cursor** — 光标相关。自定义光标、拖尾、聚光灯、磁吸跟随
- **3d-scene** — 三维空间场景。旋转模型、可交互 3D 物体、空间穿越

## 目录结构

```
effects-shelf/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← 主页 Bento Grid
│   │   └── [category]/
│   │       ├── page.tsx          ← 分类列表页
│   │       └── [slug]/
│   │           └── page.tsx      ← 单个效果展示页
│   ├── components/
│   │   ├── bento-grid.tsx        ← 主页网格
│   │   ├── effect-card.tsx       ← 效果卡片
│   │   └── tech-tag.tsx          ← 标签组件
│   └── data/
│       └── effects.ts            ← 效果元数据注册表
├── public/
│   └── previews/                 ← 缩略图/预览 gif（备用）
├── claude.md                     ← 本文件
├── package.json
├── next.config.ts
└── tailwind.config.ts
```

## 主页 Bento Grid 卡片尺寸

- 大卡片（2×2）：hover, scroll, background
- 中卡片（2×1）：click, text, page-transition
- 小卡片（1×1）：loading, layout, cursor, 3d-scene, gesture

尺寸反映使用频率，可随积累调整。

## 添加新效果的流程

1. 在 `src/data/effects.ts` 中添加一条 Effect 数据
2. 在 `src/app/[category]/[slug]/page.tsx` 对应路径下创建效果页面
3. 效果页面只需包含纯前端代码（CSS / JS / Canvas / WebGL），无需后端

## 视觉规范

### 调性
偏编辑感（editorial），参考 Linear、Raycast、Vercel 官网气质——干净、克制、有细节。不是 SaaS Dashboard 的冷感，也不是 Dribbble 上的过度装饰。

### 色彩
- 整站深色底。页面背景 `#0A0A0A`（近纯黑）
- 卡片背景 `#1A1A1A`（微微提亮的深灰），靠亮度差区分层级，不用阴影
- 文字主色白色 `#FFFFFF`，次要文字 `#888888`
- 边框 `rgba(255,255,255,0.06)`，极细（0.5-1px）

### 卡片
- 圆角 12-16px
- 无阴影
- 内边距至少 24px，留足呼吸空间
- 内容分两部分：上方是活的效果预览区域（占比约 60%），下方是分类名 + 效果数量（占比约 40%）

### 文字
- 分类名用英文，简洁
- 字体使用系统默认无衬线字体或 Inter

### 响应式
- 桌面端：Bento Grid 大小卡片混排
- 移动端：待定（先不处理，桌面端优先）

### 页面切换效果
- 主页点击分类卡片 → 卡片展开（shared element transition）：卡片本身平滑放大，变成下一页的容器，用户感受是"走进了这个分类"
- 技术方案：View Transitions API（Next.js App Router 逐步支持中），实现时再确认具体方案
- 不用淡入淡出（太平）、不用侧滑（偏 app 感）、不用遮罩展开（太重）

## 设计原则

- 主页和分类列表页的效果预览应该是"活的"（实际运行的效果），不是截图
- 一级分类目前够用，不做二级分类。等某个分类超过 15 个效果时再考虑拆分
- style / element 等标签不穷举，遇到新的就加
- 保持结构简单，降低每次新增效果的摩擦