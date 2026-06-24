# Map Roulette v1 — 参考实现深度解析

参考文件：`components/map_roulette/v1/`

---

## 整体架构

三个 React 组件 + 一个 App 协调层，加一个 `window.COUNTRIES` 全局数据对象。

```
App
├── header：SPIN 按钮 / 标题 / 运行元数据（RUNS / POOL / SEED）
└── main (2列)
    ├── left
    │   ├── CountryReel（轮盘列表）
    │   └── DetailPanel（国家详情）
    └── right
        └── WorldMap（SVG 世界地图）
```

---

## 子系统 1：WorldMap

**数据来源**：在组件挂载时异步 fetch `world-atlas@2.0.2/countries-110m.json`（TopoJSON），通过 `topojson.feature()` 转为 GeoJSON FeatureCollection。

**投影**：`d3.geoNaturalEarth1()`，scale=210，translate 到 1100×720 SVG 中心（+10px 向下偏移）。

**渲染内容**：
- radialGradient 背景填充（营造深度感）
- Graticule 网格线，20° 间距，颜色 `#171b23`，stroke 0.6px
- Sphere 轮廓（地球边界线）
- 所有国家 `<path>`，默认填充 `#1a1e26`
- 激活国家：`fill: #ff2d55`，stroke `#ff5c7a`，额外 `feGaussianBlur + feMerge` glow filter
- Crosshair：`d3.geoCentroid()` 定位国家中心，2 个同心圆 + 4 条水平/垂直射线，整体施 `pulse` opacity 动画

**ID 匹配逻辑**：
```js
String(f.id).padStart(3, "0") === activeId
```
TopoJSON 中 feature.id 是数字（无前导零），countries_v1.js 中 id 是 3 位字符串（如 `"840"`），需要 `padStart` 对齐。

**关键特性**：地图始终是全球视图，无 zoom/world 切换。Spin 过程中地图**实时跟随** visibleIndex 更新——每一帧都高亮当前经过的国家，造成"扫描"视觉效果。

---

## 子系统 2：CountryReel（轮盘列表）

**渲染方式**：直接渲染 `REVOLUTIONS + 2 = 9` 份国家列表副本，共 450 个 DOM 节点，通过 `translateY(-scrollY)` 滚动。

**组件 props**：

| prop | 含义 |
|---|---|
| `scrollY` | 当前绝对偏移（px），从 App state 传入 |
| `visibleIndex` | 当前激活的绝对 index（跨副本连续计数） |
| `isSpinning` | 是否正在旋转 |
| `spinSpeed` | 当前速度（px/16ms），用于模糊强度 |

**激活高亮**：`c._absIndex === visibleIndex`，绝对 index 匹配。

**Motion blur**：`blur = Math.min(8, spinSpeed / 10)`，应用在整个 `.reel-track` div 上（不限于可视区）。

**reel-selector 覆盖层**：
- 绝对定位，垂直居中，高度 = ITEM_HEIGHT (56px)
- 上下红色边框 + 外发光 shadow
- 平行副线（before/after 伪元素，偏移 3px）
- 左右箭头符号 ▸ ◂，颜色 signal red

**渐隐边缘**：上下各 90px 渐变遮罩（从 `var(--panel)` 到透明），让列表"消失进面板"。

---

## 子系统 3：DetailPanel（详情面板）

**Spin 期间**：显示当前经过的国家（"SCANNING" 状态，琥珀色 pill + blink 动画）。

**Spin 完成后**：显示锁定的目标国家（"LOCKED" 状态，红色 pill）。

**内容布局**：
- header 行：3 列（国旗 78×52px / code+name+continent / status pill）
- 2×2 stat 网格：CAPITAL / POPULATION / AREA / DENSITY
- 数字格式：人口分级显示（B/M/K），面积单位 km²，密度 /km²

**国旗来源**：`flagcdn.com/w160/{code.toLowerCase()}.png`，加载失败时隐藏图片。

---

## Spin 核心算法

```
初始状态：scrollY = 0，visibleIndex = 0（第一个国家）

每次 Spin：
  startScrollY = 当前 scrollY
  currentIdx   = visibleIndex % n
  targetIdx    = 随机（避免与当前相同）

  finalAbsIndex = floor(startScrollY / ITEM_HEIGHT)
                + REVOLUTIONS * n                     ← 7 圈
                + (targetIdx - currentIdx + n) % n    ← 到目标的剩余步数

  finalScrollY  = finalAbsIndex * ITEM_HEIGHT

  动画：scrollY 从 startScrollY → finalScrollY
        easeOutQuart，SPIN_MS = 6000ms

每帧副作用：
  visibleIndex = round(y / ITEM_HEIGHT)   → 驱动地图和详情实时更新
  spinSpeed    = (Δy / Δt) × 16          → 驱动 blur 强度
```

**潜在问题**：scrollY 单调递增，第 2 次 spin 后 finalAbsIndex 会超出 reel 的总项目数（9×50=450），导致激活高亮失效（但国家选择逻辑通过 `visibleIndex % n` 仍正常）。这是 v1 的已知局限，实际体验中不明显，因为高亮行消失前 reel 动画已经在运动中。

---

## 视觉设计系统

**调性**：Sci-fi HUD / 战术监控界面。参考 NASA 任务控制室的信息密度和颜色系统。

**色彩变量**：
```
--bg:     #0a0c10  ← 近纯黑，带蓝调
--panel:  #14171d  ← 面板底色
--signal: #ff2d55  ← 信号红（高亮、激活、按钮）
--amber:  #ffb547  ← 琥珀色（SCANNING 状态）
--ink:    #e6e8eb  ← 主文字
--muted:  #6b7079  ← 次要文字
--mono:   JetBrains Mono
--sans:   Inter
```

**面板系统**：每个 panel 有 `panel-head`（带编号标签 `01 · INDEX`、`02 · ATLAS` 等），面板上边有高光线（伪元素）。

**背景纹理**：
```css
repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px)
```
+ 两个 radial-gradient 光晕（蓝调 + 红调）。

**全局 HUD 角标**：4 个角落各有 14px 的 L 形边框（`border` 切断上或下），纯装饰。

**Scanline 动画**：地图上有一条 2px 红色光线从顶部扫到底部（7s 循环），head 端有半透明红光拖尾。

---

## 数据层

50 个国家，结构：
```js
{ id: "840", code: "US", name: "United States", capital: "Washington, D.C.", pop: 333_287_557, area: 9_833_517, continent: "North America" }
```

- `id`：ISO 3166-1 数字代码（3 位字符串），匹配 world-atlas TopoJSON 的 feature.id
- `code`：ISO alpha-2（2 位），用于国旗 URL 和显示
- 选国策略：覆盖全球代表性国家，偏重大/知名，非 UN 全量

---

## 交互细节

- **Space 键**：触发 Spin（`window.addEventListener("keydown")`）
- **防重**：`if (isSpinning) return`
- **历史**：最近 5 次结果，显示为 code chip（最新的红色高亮）
- **RUNS counter**：计数累计 spin 次数，3 位 padStart 显示
- **SEED 显示**：`Date.now() % 0xFFFF` 的十六进制，纯装饰（并非真正的 RNG seed）
