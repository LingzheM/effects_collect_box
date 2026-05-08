# Map Roulette v1 — 任务设计文档

日期：2026-05-08
分支：claude/map-roulette-selector-DRY6Z

---

## 实现目标

一个可运行的浏览器页面，包含：
- 左侧国家列表，点击 SPIN 触发老虎机式滚动，停下后高亮选中国家
- 右侧 SVG 世界地图，选中国家高亮为红色
- ZOOM 按钮平滑放大地图到选中国家，WORLD 按钮复位
- 底部详情面板展示国旗、基本信息

---

## 整体实现顺序

```
Phase 0（数据层）
  → Phase 1（静态地图）
  → Phase 2（列表面板）
  → Phase 3（选中高亮，列表 + 地图联动）
  → Phase 4（Spin 动画）
  → Phase 5（Spin ↔ 高亮时序耦合）
  → Phase 6（Zoom / World 视图切换）
  → Phase 7（详情面板）
  → Phase 8（视觉打磨）
```

MVP = Phase 0 + 1 + 2 + 3 + 4 + 5，其余是增量增强。

---

## Phase 0 · 数据层

**目标**：建立国家数据结构，为后续所有 Phase 提供数据基础。

### Task 0.1 · 确定数据来源

- Step 1：GeoJSON 来源选择 `natural-earth-vector` 的 `ne_110m_admin_0_countries.geojson`，文件约 100KB，形状可接受
- Step 2：国家元数据（人口、首都、货币等）使用 `restcountries.com` 的静态 JSON 快照，或直接内嵌一个精简版 `countries.json`（~250 条）
- Step 3：两者的关联字段：国家 ISO 3166-1 alpha-3 代码（`ADM0_A3` in GeoJSON，`cca3` in restcountries）

**评价标准**：能从 GeoJSON feature 的 properties 找到 ISO code，并能用 ISO code 查到元数据。

### Task 0.2 · 数据结构定义

```ts
type Country = {
  iso3: string        // "CHN", "USA", "FRA"
  name: string        // 显示名
  flag: string        // emoji 国旗，如 "🇨🇳"，或 flag CDN URL
  capital: string
  population: number
  area: number        // km²
  region: string      // "Asia", "Europe", etc.
  currency: string    // "CNY - Chinese Yuan"
  languages: string[] // ["Mandarin Chinese"]
}
```

- Step 1：整理 `countries.json`，只保留上述字段，250 条左右
- Step 2：国旗方案选择：用 `flagcdn.com/w40/{iso2}.png` 的图片 URL（iso2 = 两位代码），而非 emoji，后者在不同系统渲染差异太大
- Step 3：验证 GeoJSON 的 `ADM0_A3` 字段与 countries.json 的 `iso3` 字段能完全对上，处理例外情况（Kosovo、Taiwan 等地缘敏感条目）

**评价标准**：写一个 `getCountryByIso3(iso3: string): Country | undefined` 函数，能正确返回数据，覆盖率 > 95%。

---

## Phase 1 · 静态 SVG 世界地图

**目标**：在页面右侧渲染一张可见的世界地图，国家边界清晰，没有任何交互。

**评价标准（视觉）**：能目测认出大陆轮廓，国家边界线清晰，没有渲染错误或重叠。

### Task 1.1 · 选择投影方案

- Step 1：评估投影选项：
  - **Natural Earth**：形状自然，高纬度失真小，视觉最友好 ✓
  - **Mercator**：高纬度变形严重，面积失真大 ✗
  - **Equirectangular**：等矩形，计算简单，但极地拉伸 △
- Step 2：决策：使用 **Natural Earth 投影**（`d3.geoNaturalEarth1()`）
- Step 3：确定 SVG 画布尺寸：宽 960，高 500（这是 d3 地图的标准基础尺寸，之后通过 viewBox 缩放）

### Task 1.2 · GeoJSON → SVG Path 转换

- Step 1：引入 `d3-geo`（`d3.geoPath` + `d3.geoNaturalEarth1`），将每个 GeoJSON feature 转换为 SVG `<path>` 的 `d` 属性
- Step 2：每个 `<path>` 携带 `data-iso3` 属性（从 feature.properties.ADM0_A3 读取），作为后续高亮的选择器 hook
- Step 3：用 React 渲染：`countries.features.map(f => <path key={f.properties.ADM0_A3} d={geoPath(f)} data-iso3={...} />)`

### Task 1.3 · 基础样式

- Step 1：国家填充色 `#2a2a2a`（深灰，符合项目深色基调）
- Step 2：边界线颜色 `rgba(255,255,255,0.08)`，宽度 0.5px
- Step 3：SVG 背景（海洋）`#0f1923`（深蓝灰，区别于陆地）
- Step 4：加一个 `<rect>` 作为海洋背景，放在所有 `<path>` 之前

**评价标准**：`http://localhost:3000/click/map-roulette` 能看到世界地图，肉眼可辨认大洲。

---

## Phase 2 · 国家列表面板

**目标**：左侧出现国家列表，按字母顺序排列，可以滚动，每项显示国旗图片 + 国家名。

### Task 2.1 · 列表数据准备

- Step 1：从 countries.json 中取所有国家，按 `name` 字母排序
- Step 2：列表项结构：`{ iso3, name, flagUrl }`，flagUrl 从 flagcdn 构造

### Task 2.2 · 列表 UI 组件

- Step 1：固定高度容器（`overflow: hidden`），列表项高度固定（如 44px），便于后续精确计算滚动位置
- Step 2：每一项：左侧国旗图片（`32×24px`），右侧国家名（14px，`#888`）
- Step 3：选中项样式：背景 `rgba(255,0,0,0.08)`，国家名变白，左侧加红色竖条（`3px solid #e53935`）
- Step 4：列表容器 `ref` 挂载，用于后续 JS 控制 `scrollTop`

**评价标准**：能看到完整列表，可以用鼠标滚动浏览所有国家。

---

## Phase 3 · 选中高亮（列表 + 地图联动）

**目标**：点击列表中任意国家 → 列表高亮该项 → 地图对应国家变红。这是验证数据层和渲染层是否打通的关键节点。

### Task 3.1 · 状态管理

```ts
const [selectedIso3, setSelectedIso3] = useState<string | null>(null)
```

- Step 1：列表项 `onClick` → `setSelectedIso3(iso3)`
- Step 2：地图 `<path>` 的 `fill` 由 `selectedIso3` 决定：选中的填 `#e53935`，其余填 `#2a2a2a`
- Step 3：列表项的 `className` 也由 `selectedIso3` 决定

### Task 3.2 · 地图高亮样式

- Step 1：选中的 `<path>` 填充色 `#e53935`（鲜红）
- Step 2：hover 态填充色 `#3a3a3a`（轻微提亮），鼠标悬停时有反馈
- Step 3：选中国家加 CSS transition：`fill 150ms ease`，让颜色切换不那么硬

**注意**：这里的 150ms 过渡是一个关键设计决定——后续 Phase 5 的时序耦合会依赖这个数字。

### Task 3.3 · 列表自动滚动到选中项

- Step 1：`selectedIso3` 变化时，计算选中项在列表中的 index
- Step 2：`listRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })`
- Step 3：让选中项出现在列表容器的中间位置（`top = index * ITEM_HEIGHT - containerHeight / 2 + ITEM_HEIGHT / 2`）

**评价标准**：点击任意列表项，地图对应国家立刻变红，列表平滑滚动到该项。点击另一个，前一个恢复，新的变红。

---

## Phase 4 · Spin 动画（列表轮盘）

**目标**：点击 SPIN 按钮后，列表以"老虎机"方式快速滚动，逐渐减速，停在随机选中的国家上。

这是整个 effect 的核心动画，手感是关键。

### Task 4.1 · Spin 逻辑设计

**随机选择**：
- Step 1：`const targetIndex = Math.floor(Math.random() * countries.length)`
- Step 2：记录目标 iso3，准备在动画结束后设置 `selectedIso3`

**滚动距离计算**：
- Step 1：当前 scrollTop = `currentIndex * ITEM_HEIGHT`
- Step 2：目标 scrollTop = `targetIndex * ITEM_HEIGHT - containerHeight / 2 + ITEM_HEIGHT / 2`（居中显示）
- Step 3：为了制造"转了好几圈"的感觉，在目标位置前加 2-3 个完整列表的长度：`totalScroll = fullListHeight * 3 + targetOffset`
  - 列表在内部循环（或虚拟无限）才能做到，否则列表从底部滚到顶部会出现空白

### Task 4.2 · 虚拟无限列表方案

无限滚动是 Spin 动画的技术难点，有两种方案：

**方案 A：列表复制（Clone List）**
- 将国家列表复制 5 份，首尾相连
- 滚动在中间 3 份中进行，避免碰到边界
- 当 scrollTop 超出范围时，静默重置到对应位置（无动画时执行）

**方案 B：JS 控制 translateY 模拟滚动**
- 不使用 `scrollTop`，而是控制内层 `div` 的 `translateY`
- 用 `requestAnimationFrame` 手动更新位置
- 更精确，但代码量更大

决策：**方案 B**，因为缓动曲线需要精细控制，用 `requestAnimationFrame` 更可靠。

### Task 4.3 · 缓动曲线实现

```ts
// ease-out-quart：慢慢减速，停下时有"咔哒"质感
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}
```

- Step 1：记录动画开始时间 `startTime = performance.now()`
- Step 2：总动画时长 `duration = 1600ms`（0-800ms 快速，800-1400ms 减速，1400-1600ms 弹性收尾）
- Step 3：每帧计算 `progress = (now - startTime) / duration`，代入缓动函数
- Step 4：`currentTranslateY = startY + (targetY - startY) * easeOutQuart(progress)`
- Step 5：`progress >= 1` → 动画结束，调用回调

**弹性收尾（可选）**：
在到达目标位置后，添加一个小幅过冲再弹回的效果（spring-like）：
```
t ∈ [0.875, 1.0]：添加 sin 波形偏移，最大偏移量 = ITEM_HEIGHT * 0.15
```

### Task 4.4 · Spin 状态管理

```ts
type SpinState = 'idle' | 'spinning' | 'done'
const [spinState, setSpinState] = useState<SpinState>('idle')
```

- Step 1：`spinState === 'spinning'` 时，SPIN 按钮禁用（防止重复触发）
- Step 2：`spinState === 'spinning'` 时，列表项不响应点击
- Step 3：动画结束 → `setSpinState('done')` → 触发 `setSelectedIso3`

**评价标准**：
- 点击 SPIN，列表快速滚动，有明显的减速过程
- 停下时目标国家居中显示，有轻微的"回弹"质感
- 整体动画时长约 1.5-2 秒，不太快也不太慢
- 连续点击 SPIN 不会产生动画叠加或状态混乱

---

## Phase 5 · Spin ↔ 高亮的时序耦合

**目标**：地图高亮和列表停止不是同时触发，而是有精心设计的时序关系，制造"揭晓"感。

这是最容易被忽略但最影响体验质感的 Phase。

### Task 5.1 · 时序设计

```
Spin 开始         地图高亮清除（快速，100ms fade to #2a2a2a）
     ↓
Spin 进行中       地图无高亮（全灰状态，地图"等待结果"）
     ↓
列表减速到 80%    地图开始"抖动"（预告即将揭晓）← 可选
     ↓
列表停止（t=0ms） ─── 延迟 200ms ───→ 地图高亮出现（150ms fade in to #e53935）
     ↓
列表高亮立刻出现  地图高亮比列表慢 200ms
```

这 200ms 的延迟是关键：它让地图高亮成为"确认结果"而非"同时发生"，强化揭晓感。

### Task 5.2 · 实现细节

- Step 1：Spin 开始时：`setSelectedIso3(null)`，地图所有国家回到灰色（触发 150ms CSS 过渡）
- Step 2：列表动画结束回调中：先设置列表高亮 `setSpinningHighlight(targetIso3)`（立即）
- Step 3：`setTimeout(() => setSelectedIso3(targetIso3), 200)`（延迟 200ms 触发地图高亮）
- Step 4：地图高亮的 CSS transition 改为 `fill 150ms ease-in`（稍快，更像"弹出来"）

**注意**：`spinningHighlight` 和 `selectedIso3` 是两个独立状态：
- `spinningHighlight`：仅控制列表项的高亮，在 Spin 结束时立即设置
- `selectedIso3`：控制地图高亮 + 详情面板，延迟 200ms 设置

### Task 5.3 · 滚动过程中的"路过高亮"（可选增强）

在列表快速滚动时，当前视口中间的国家可以有一个淡淡的"路过"高亮（不是红色，而是 `rgba(255,255,255,0.1)` 的提亮）。

- Step 1：每帧根据当前 translateY 计算中间项的 index
- Step 2：用 CSS class `.passing` 标记该项，`background: rgba(255,255,255,0.06)`
- Step 3：不更新地图（性能考虑），只更新列表中间项的样式

**评价标准**：
- Spin 开始后地图清空高亮
- 列表停下后 200ms，地图高亮"弹出"到正确国家
- 整体有"宣布结果"的节奏感，而不是机械的同步切换

---

## Phase 6 · Zoom / World 视图切换

**目标**：ZOOM 按钮让地图平滑放大聚焦到选中国家，WORLD 按钮复位到全球视图。

### Task 6.1 · 边界框计算

- Step 1：用 `d3.geoBounds(feature)` 获取选中国家的经纬度边界 `[[lon0, lat0], [lon1, lat1]]`
- Step 2：用投影函数转换为 SVG 坐标：`[x0, y0]` 和 `[x1, y1]`
- Step 3：计算需要的 viewBox：加 10% padding，确保国家不贴边
- Step 4：对于极小国家（面积 < 1000 km²），设置最小 viewBox 尺寸（如 20×10 SVG 单位），避免放大过度

### Task 6.2 · viewBox 动画

- Step 1：SVG viewBox 属性是 `"x y width height"` 格式
- Step 2：当前 viewBox → 目标 viewBox，用 `requestAnimationFrame` 线性插值，duration 600ms，`easeInOutCubic`
- Step 3：同时，所有国家的 `<path>` stroke-width 随 zoom 缩放反向调整（放大时线条变细，避免遮盖形状）

### Task 6.3 · WORLD 复位

- Step 1：目标 viewBox 恢复为初始值（`0 0 960 500`）
- Step 2：同样用 600ms 动画过渡，用 `easeInOutCubic`

**评价标准**：ZOOM 后能清晰看到选中国家的形状，WORLD 后流畅回到全球视图。小国不会放大到失真，大国（Russia、China）不会只看到局部。

---

## Phase 7 · 详情面板

**目标**：选中国家后，底部（或侧边）展示详细信息，切换时有动画过渡。

### Task 7.1 · 面板结构

```
┌────────────────────────────────────────────────────────┐
│  [国旗图片 64×48]  [国家名 24px bold]  [区域 14px #888] │
│                                                        │
│  首都: Beijing    人口: 1.4B    面积: 9.6M km²         │
│  货币: CNY        语言: Mandarin                       │
└────────────────────────────────────────────────────────┘
```

### Task 7.2 · 切换动画

- Step 1：`selectedIso3` 变化时，旧内容 fade out（opacity 0，150ms），新内容 fade in（opacity 1，150ms，delay 100ms）
- Step 2：用 `key={selectedIso3}` 触发 React 重新挂载，配合 CSS animation 实现
- Step 3：国旗图片加载时显示 placeholder（灰色方块），加载完成后淡入

### Task 7.3 · 空状态

- Step 1：`selectedIso3 === null` 时显示提示文字：`"Press SPIN to discover a country"`
- Step 2：文字居中，颜色 `#555`，14px

**评价标准**：连续 Spin 多次，详情面板每次都能正确更新，国旗加载流畅，没有布局抖动。

---

## Phase 8 · 视觉打磨

只在 MVP 跑通后才做。

### Task 8.1 · 微交互

- SPIN 按钮 hover：轻微 scale(1.02)，background 加深
- SPIN 按钮 active（点击瞬间）：scale(0.97)，模拟按压
- SPIN 进行中：按钮内文字变为 `SPINNING...`，加旋转的省略号

### Task 8.2 · 列表滚动阴影

- 列表容器顶部和底部加渐变遮罩（`pointer-events: none`）：
  - 顶部：`linear-gradient(to bottom, #0A0A0A, transparent)`，高度 40px
  - 底部：`linear-gradient(to top, #0A0A0A, transparent)`，高度 40px
- 制造列表"从黑暗中滚出"的纵深感

### Task 8.3 · 地图 hover 效果

- 任意国家 hover 时：fill 轻微提亮（`#3d3d3d`），cursor 变成 `pointer`
- 点击地图上的国家：直接选中（等价于点击列表项），列表滚动到该项

### Task 8.4 · 响应式检查

- 当前设计桌面优先，最小支持宽度 900px
- 低于 900px 时，地图和列表改为上下布局（列表在上，地图在下，固定高度 240px）

---

## 关键设计决策汇总

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 地图投影 | Natural Earth | 视觉最自然，高纬度失真最小 |
| GeoJSON 精度 | 110m 或 50m | 权衡文件大小和形状精度 |
| 国旗方案 | flagcdn.com 图片 | Emoji 跨平台渲染不一致 |
| Spin 动画实现 | JS RAF + translateY | 比 scrollTop 更精确，缓动曲线完全可控 |
| 缓动曲线 | easeOutQuart | 减速感强，停下时有"咔哒"质感 |
| 高亮时序 | 列表先，地图延迟 200ms | 强化"揭晓"仪式感 |
| Zoom 方案 | SVG viewBox 动画 | 无需额外库，SVG 原生支持 |

---

## 风险点

**GeoJSON 国家 ISO 对齐**：部分地区（台湾、科索沃、巴勒斯坦）在不同 GeoJSON 来源中有不同的 ISO 处理，需要提前验证并决定显示策略。

**极小国家 Zoom**：梵蒂冈、摩纳哥等在 110m 精度下可能完全不可见（polygon 面积为 0），需要 fallback 逻辑。

**Spin 动画的性能**：requestAnimationFrame 更新列表时，如果国家列表有 250 条且全部 DOM 渲染，可能有性能问题。需要用 CSS `will-change: transform` 和虚拟滚动（只渲染可视区 ±5 条）。

**国旗图片的网络请求**：250 个国旗按需加载，切换时如果网络慢会有白块。方案：只加载可视区的国旗，Spin 结束后加载选中国家的高清国旗。
