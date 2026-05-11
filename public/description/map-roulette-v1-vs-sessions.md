# Map Roulette — v1 实现 vs Sessions 设计文档的不一致

> Sessions 文件（`sessions/2026-05-08_map-roulette-v1-task-design.md`）今后不再作为开发依据。
> 本文档记录两者的差异，说明 v1 做了什么不同的选择，以及为什么。

---

## 1. Spin 算法：两套完全不同的方案

### Sessions 设计：「多副本 + 静默重置」

```
渲染 10 份列表副本（COPIES = 10）
初始位置：copy 4，每次 spin 落在 copy 9
动画结束后，瞬间 reset 到 copy 4 的相同 index
下次 spin 从 copy 4 重新出发
```

优点：scrollY 永远有界，不会溢出。  
缺点：需要精确计算 yFor() 函数，reset 时有隐式状态依赖。

### V1 实现：「scrollY 单调递增」

```
scrollY 从 0 开始，每次 spin 累加约 REVOLUTIONS × n × ITEM_H
trackRef.current.style.transform = translateY(-scrollY)
visibleIndex = round(scrollY / ITEM_H)，取模后得到实际国家 index
```

优点：逻辑极简，spin 算法无需"副本"概念。  
**已知缺陷**：第 2 次 spin 后 scrollY 超出 reel 总高度（9×50×56 = 25200px），reel 内的激活高亮会失效（但国家选择逻辑仍正确，因为用了取模）。

**结论**：v1 算法在多次 spin 后存在视觉 bug，sessions 的「副本+重置」方案更健壮。当前 map-roulette.tsx 已实现副本重置方案，保留。

---

## 2. Easing 曲线

| | Sessions | V1 | 当前实现 |
|---|---|---|---|
| 函数 | easeOutExpo | easeOutQuart | easeOutExpo |
| 公式 | `1 - 2^(-10t)` | `1 - (1-t)^4` | `1 - 2^(-10t)` |
| 特点 | 极速起步，超长尾 | 匀速减速，无极端 | 同 sessions |

easeOutQuart 在视觉上更「有重量感」——起步不那么突然，减速更线性可见。
easeOutExpo 的极速起步营造强烈的随机感，但很快过渡到缓慢，最后几百毫秒极为精准。

两者都可以，但 v1 的 easeOutQuart 更符合老虎机的「物理感」。**建议切换为 easeOutQuart**。

---

## 3. 动画时长与圈数

| | Sessions | V1 | 当前实现 |
|---|---|---|---|
| 时长 | 2400ms | 6000ms | 2400ms |
| 圈数 | ~5 圈 | 7 圈 | ~5 圈 |
| 节奏感 | 快，2 秒结束 | 慢，6 秒建悬念 | 同 sessions |

6000ms 的 v1 给足了"期待感"——有 4-5 秒的快速扫描期，最后 1-2 秒慢慢靠近目标。这是赌博机 / gacha 的标准节奏。2400ms 明显偏短，悬念还没起来就结束了。**建议延长到 4000-5000ms**，7 圈或至少 5 圈。

---

## 4. 地图高亮的时序

| | Sessions 设计 | V1 实现 |
|---|---|---|
| Spin 开始时 | 地图高亮清除 | 地图继续跟随旋转，实时切换 |
| Spin 过程中 | 地图无高亮 | 地图每帧更新，显示当前经过国家 |
| Spin 结束后 | 延迟 200ms 高亮出现 | 立即高亮最终国家 |

Sessions 把地图高亮设计为「揭晓时刻」的仪式感；v1 把地图做成「扫描显示器」——旋转期间地图也在扫描。

V1 的方案更好：国家被扫过、地图在闪烁——这与列表滚动产生了视觉呼应。Sessions 方案的 200ms 延迟反而破坏了同步感。**采用 v1 的实时更新方案**。

---

## 5. 国家数据池

| | Sessions | V1 | 当前实现 |
|---|---|---|---|
| 国家数量 | 195（全量名称） | 50（精选 + 元数据） | 195（仅名称） |
| 字段 | 仅 name | id, code, name, capital, pop, area, continent | 仅 name |
| ISO 数字 id | 有计划 | 有 | 无 |

V1 选 50 个知名国家是刻意的：
1. 减少数据量，地图高亮更直观（大国更容易识别）
2. 50 个国家的轮盘旋转速度感更合适（195 个会转很久才能感受到"经过了所有国家"）
3. 每个国家都有完整元数据（人口、面积、密度）

**采用 v1 的数据结构**，但国家数量可以扩展到 80-100。195 个名称字符串对旋转 UX 没有额外意义，且缺乏元数据使详情面板无法实现。

---

## 6. 列表 Item 布局

| | Sessions | V1 | 当前实现 |
|---|---|---|---|
| 列数 | 1（仅 name） | 3（code / name / continent） | 1（仅 name） |
| 行高 | 44px | 56px | 44px |
| 字体 | 系统无衬线 | JetBrains Mono | 系统无衬线 |

3 列布局显著提升了信息密度和可读性。`code` 列（US, CN, JP）在快速旋转时比全名更清晰可辨；`continent` 列提供分类感。56px 行高给 3 列内容提供了足够的呼吸空间。**采用 v1 的 3 列布局和 56px 行高**。

---

## 7. 全局视觉风格

| 维度 | Sessions | V1 |
|---|---|---|
| 调性 | Editorial（Linear/Raycast 气质） | Sci-fi HUD（战术监控界面） |
| 背景色 | `#0A0A0A`（项目规范） | `#0a0c10`（带蓝调） |
| 主色 | `#e53935`（红） | `#ff2d55`（信号红，略偏粉） |
| 字体 | 系统无衬线 | Inter + JetBrains Mono |
| 面板 | 圆角 12-16px，无边框 | 直角 3px，有 1px 边框 |
| 装饰 | 极少 | 扫描线、角标、像素点 |

Sessions 遵循 CLAUDE.md 的 editorial 视觉规范（克制、干净）；v1 是独立的 sci-fi 风格，**与项目整体调性不符**。

**保留项目 editorial 风格，但从 v1 借鉴结构性设计**：
- 保留面板标签（`01 · INDEX` 风格）作为轻量 label，不做成重型 HUD
- 保留 signal red 作为高亮色但不做 glow
- 不引入扫描线、角标等装饰
- 不使用 JetBrains Mono（项目未引入外部字体）

---

## 8. Sessions 计划但 V1 没有的功能

| 功能 | Sessions 计划 | V1 状态 |
|---|---|---|
| ZOOM 按钮 | 是，viewBox 动画聚焦选中国家 | 无 |
| WORLD 按钮 | 是，恢复全球视图 | 无 |
| 高亮过渡动画 | 是，150ms fade | 无（instant 切换） |

ZOOM 是差异化功能，让用户能"走进"选中的国家。V1 省略是因为原版全球视图下大国已经清晰可见。对于小国（Iceland、Monaco 等），zoom 确实有实用价值。**当前阶段先不实现 zoom，后续可迭代**。

---

## 9. V1 有但 Sessions 没有设计的功能

| 功能 | V1 | Sessions |
|---|---|---|
| Space 键触发 Spin | 有 | 无 |
| RUNS / POOL / SEED 元数据显示 | 有 | 无 |
| SCANNING / LOCKED 状态切换 | 有 | 无 |
| 最近 5 次历史记录 chip | 有 | 无 |
| Crosshair 覆盖层（十字线 + 圆） | 有 | 无 |
| Reel selector 红色边框 + 箭头 | 有 | 部分（hairline only） |

Space 键：低成本，体验提升明显，**采用**。
元数据显示（RUNS/POOL/SEED）：装饰性强，**简化版采用**（只保留 SPINS 计数）。
SCANNING/LOCKED：在详情面板中区分旋转中 vs 锁定后，**采用逻辑，简化样式**。
历史记录：**采用**，但放在足部信息条而非地图底部。
Crosshair：**采用**，有助于定位小国。
Selector 箭头：**简化**，保留红色边框，去掉 ▸ ◂ 符号。

---

## 总结：开发依据变更

| 维度 | 沿用当前实现 | 采用 v1 方案 |
|---|---|---|
| Spin 算法 | 副本+重置（✓ 更健壮） | — |
| Easing | — | easeOutQuart |
| 动画时长/圈数 | — | ~5000ms / 7圈 |
| 地图实时更新 | — | 实时跟随 visibleIndex |
| 国家数据 | — | 50+ 条含元数据 |
| 列表 item 布局 | — | 3列（code/name/continent） |
| 行高 | — | 56px |
| 全局风格 | Editorial（项目规范） | — |
| 颜色 | `#0A0A0A` / `#1A1A1A` 体系 | — |
| Space 键 | — | 采用 |
| SPINS 计数 | — | 简化版采用 |
| 详情面板 | — | 含 scanning/locked 状态 |
| 历史记录 | — | 采用 |
| Crosshair | — | 采用 |
| Zoom/World | 不实现（当前阶段） | — |
