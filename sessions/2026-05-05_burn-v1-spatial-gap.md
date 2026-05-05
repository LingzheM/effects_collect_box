# Session: burn v1 补充说明 — 差距分析与 Phase/Task 定义

日期：2026-05-05
分支：claude/review-v1-burn-docs-3sXTs

---

## 背景

用户任务：拉取最新 master，阅读 burn.md 的 `# v1 补充说明`，对照当前 burn-paper 实现，找出差距，定义需要新增的 Phase 和 Task。

---

## 当前实现现状（burn-paper.tsx）

交互模型：点击任意位置点火，燃烧自动推进（threshold 线性递增），再次点击可添加第二个火点。

空间结构：单一纸张平面（PlaneGeometry 2×2），背景为 CSS 纯色 `#1a1410`，没有背景网格。

已实现内容：
- Phase 0：WebGLRenderer + OrthographicCamera + PlaneGeometry（128 segments 支持顶点弯曲）
- Phase 1：CPU 生成 FBM DataTexture（512² 或 256² 移动端降级）
- Phase 2：Fragment Shader — 三区判断（discard / 火焰色带 / 纸张区），4 段渐变，flicker 动画，fake HDR glow
- Phase 3：threshold 线性 + 正弦波动推进；点击交互（起点 + 第二点）
- Phase 4：Canvas 生成纸张颗粒纹理；顶点 Shader 中基于 effectiveNoise 的边缘卷曲
- Phase 5：烟雾粒子（Task 5.1）+ 余烬粒子（Task 5.2）
- Phase 6：移动端 256² 降级；?debug=noise / ?debug=threshold；FPS 叠层；FloatType fallback

---

## v1 补充说明的核心要求

v1 从"效率"转向"仪式感"与"不可逆性"，以 Issara Willenskomer 的动态设计视角出发，提出以下要求：

**Section 1 — 空间环境**
- 背景不能是虚无（纯色），要有暗色纹理（深木纹 / 冷磨砂石材）
- 纸片是唯一点光源
- 燃烧产生空洞后，火光要"溢出"并照亮背景纹理（局部动态光照）
- Z 轴层次：纸片 Z=0，背景 Z=-5

**Section 2 — 燃烧三部曲**
- 第一阶段 受热预警（Pre-Burn）：指尖触碰但未滑动时，触碰点周围出现色彩偏移（Chromatic Aberration）+ 热浪扭曲
- 第二阶段 熔蚀与空洞（Erosion & Void）：指尖滑动时纸张被撕开 —— 当前"点击自动燃烧"模式与此不符，v1 明确是手势驱动
- 第三阶段 余烬升腾（Ember Ascent）：粒子密度正比于滑动速度（手势速度决定粒子密度，当前固定速率）

**Section 4 末尾 / Issara 建议**
- 面积烧毁超过 80% 时触发"结构性坍塌"：残片自动加速化灰 + Camera Shake 或 全局 Blur
- 用户中途停止滑动时，洞口边缘应持续微微跳动（Shimmering），"动态的静止"

---

## 差距对照

| v1 要求 | 当前状态 | 差距 |
|--------|---------|------|
| 纹理背景网格（木纹/石材） | CSS 纯色 `#1a1410` | 无背景 Mesh，完全缺失 |
| 火光溢出照亮背景 | 无 | 缺失，需要背景 Shader 读取 burn 数据 |
| Z 轴空间层次 | 纸张是唯一 Mesh | 无背景平面，无空间纵深 |
| 受热预警：触碰不滑动 → 色彩偏移 + 热浪 | 无此状态，点击即开始燃烧 | Pre-Burn 状态完全缺失 |
| 手势驱动燃烧（滑动速度控制进度） | 点击自动线性推进 | 交互模型不符 |
| 粒子密度正比于滑动速度 | 固定速率（35/s、10/s） | 速度关联缺失 |
| >80% 触发结构性坍塌 | 线性推进至 done | 坍塌阶段完全缺失 |
| 停止滑动后洞口边缘 Shimmering | 无 pause 状态，burn 要么运行要么 done | pause 状态 + shimmer 缺失 |

---

## 新 Phase / Task 定义

### Phase A · 空间环境（Spatial Environment）

**Task A.1 · 背景纹理 Mesh**

目标：在纸张后方创建有质感的背景平面，取代 CSS 纯色。

- Step 1：用 Canvas API 生成暗色纹理（推荐：冷灰磨砂质感，用随机点阵 + 低频噪声模拟颗粒）
- Step 2：创建 PlaneGeometry(2, 2, 1, 1) 背景平面，材质用 MeshBasicMaterial + CanvasTexture
- Step 3：将背景平面放在 Z=-0.5（正交相机下 Z 差即深度遮挡，不需要真正的 -5）
- Step 4：调整整体亮度，背景初始极暗（luminance ≈ 0.05），为后续光照预留对比空间

**Task A.2 · 火光溢出背景（Dynamic Lighting Through Holes）**

目标：背景 Mesh 用自定义 ShaderMaterial，读取 burn 状态，在空洞区域产生暖橙色光照叠加。

- Step 1：背景平面换用 ShaderMaterial，共享纸张的 uNoise、uThreshold、uEdgeWidth、uOrigin、uOrigin2 uniforms
- Step 2：Fragment Shader 中计算每个像素的 effectiveNoise（与纸张 Shader 相同公式）
- Step 3：已烧毁区域（effectiveNoise < threshold - edgeWidth）= 空洞，背景此处接收最强光照
- Step 4：光照强度 = smoothstep 衰减，以 burn front 为中心向外衰减；颜色 = 暖橙（#FF6000）→ 背景固有色
- Step 5：光照叠加在背景纹理颜色上（additive blend 或直接 mix）
- 验证：燃烧时观察背景是否随火焰范围扩大而局部变亮

---

### Phase B · 受热预警（Pre-Burn）

**Task B.1 · 交互状态机扩展**

当前状态机：`burning | done`
新状态机：`idle | pre-burn | burning | pause | collapsing | done`

- Step 1：pointerdown → 进入 `pre-burn`，记录 touchUV，不启动 threshold 推进
- Step 2：pointermove（在 pointerdown 期间，移动距离 > 阈值约 5px）→ 从 `pre-burn` 或 `pause` 进入 `burning`
- Step 3：pointerup（在 `burning` 状态）→ 进入 `pause`（threshold 停止推进，但 uTime 继续）
- Step 4：在 `pause` 状态再次 pointerdown → 重新 pointermove → 回到 `burning`

**Task B.2 · 色彩偏移 Shader（Chromatic Aberration）**

- Step 1：新增 uniform：`uTouchUV: vec2`（归一化触碰点），`uPreBurnStrength: float`（0→1）
- Step 2：在纸张 Fragment Shader 未烧毁区，计算到 uTouchUV 的距离 d
- Step 3：在 d < 0.15 范围内，对 R/G/B 通道分别偏移采样 UV（offset ≈ 0.003 per channel，方向径向向外）
- Step 4：偏移强度 = `uPreBurnStrength * smoothstep(0.15, 0.0, d)`
- Step 5：进入 burning 状态后，uPreBurnStrength 用 0.3s 过渡衰减至 0

**Task B.3 · 热浪 UV 扭曲（Heat Wave Distortion）**

- Step 1：在未烧毁区、d < 0.2 范围内，叠加 UV 扰动：`uv += sin(uv * 12.0 + uTime * 3.0) * strength * 0.004`
- Step 2：strength 同样受 d 距离衰减，中心最强，边缘归零
- Step 3：pre-burn 阶段 strength = 1.0，进入 burning 后衰减

---

### Phase C · 手势驱动燃烧（Gesture-Driven Burn）

**Task C.1 · 手势速度采集**

- Step 1：在 pointermove 事件中，记录当前与上一帧的 UV 位移向量
- Step 2：计算速度 `gestureVelocity = |delta_uv| / delta_time`（单位：UV/s）
- Step 3：用指数平滑：`smoothedVelocity = lerp(smoothedVelocity, gestureVelocity, 0.3)`
- Step 4：当 pointerup 后，smoothedVelocity 以 0.5s 衰减至 0

**Task C.2 · Threshold 推进绑定手势速度**

- Step 1：在 `burning` 状态下，`threshold += baseSpeed * (1 + gestureVelocityScale * smoothedVelocity) * delta`
- Step 2：`gestureVelocityScale` 参数调节（使快速滑动比慢速快约 3x）
- Step 3：最大推进速度设上限，避免极快手势导致纸张瞬间消失
- Step 4：pause 状态：threshold 不推进

**Task C.3 · 粒子密度绑定手势速度**

- Step 1：`SMOKE_PER_S = 20 + smoothedVelocity * 80`（速度越快烟越多）
- Step 2：`EMBER_PER_S = 5 + smoothedVelocity * 40`（速度越快火星越多）
- Step 3：pause 状态粒子停止生成（smokeAcc/emberAcc 不累加）

---

### Phase D · 结构性坍塌（Structural Collapse）

**Task D.1 · 烧毁面积监测**

- Step 1：近似计算：当前 threshold 在 [0, 1+edgeWidth] 范围内的线性进度即为面积估算（因噪声分布近似均匀）
- Step 2：`burnProgress = threshold / (1.0 + EDGE_WIDTH)`
- Step 3：当 burnProgress > 0.8 且 burnState === "burning" → 触发坍塌，切换为 `collapsing`

**Task D.2 · 自动加速燃尽**

- Step 1：`collapsing` 状态下，speed 线性从当前值提升至 0.25/s（约 10x 正常速度）
- Step 2：threshold 继续推进至 1.0 + edgeWidth，完成后进入 `done`
- Step 3：collapsing 期间禁止新 pointerdown 重启（等 done 状态后才可重置）

**Task D.3 · Camera Shake**

- Step 1：collapsing 触发后，设 shakeTimer = 1.5s
- Step 2：每帧：`camera.position.x = Math.sin(time * 43.7) * shakeIntensity * 0.008`，`camera.position.y = Math.cos(time * 37.3) * shakeIntensity * 0.006`
- Step 3：shakeIntensity 在 1.5s 内从 1.0 衰减至 0（ease-out）
- Step 4：collapsing 结束后，camera.position 归零

---

### Phase E · 静止余烬（Shimmer on Pause）

**Task E.1 · Pause 状态 Shimmer 确认**

当前问题：`burnState === "done"` 时 threshold 在 1.0+edgeWidth，纸张完全消失，无可见边缘。
v1 描述的"中途停下"是 pause 状态（手势驱动），此时 threshold 在中间值。

- Step 1：pause 状态下，uTime 已在 render loop 中持续更新，Fragment Shader 的 flicker（高频噪声 × uTime）已在工作
- Step 2：验证：将 threshold 手动设为 0.4，观察火焰边缘是否有抖动——如果有，shimmer 已天然存在
- Step 3：若 flicker 强度不够（暗处不明显），在 pause 状态下将 flicker 系数从 0.22 提升至 0.35
- Step 4：（可选增强）pause 状态下在边缘区域额外叠加一层慢速低频呼吸动画（sin(uTime * 0.8) * 0.05）

---

## 实现顺序建议

```
Phase A（Task A.1 → A.2）→ Phase B（Task B.1 交互状态机 → B.2 → B.3）
→ Phase C（Task C.1 → C.2 → C.3）→ Phase E（Task E.1 验证）
→ Phase D（Task D.1 → D.2 → D.3）
```

最小可演示版本（MVP）：Phase A + Phase B.1 + B.2（空间感 + 触碰预警），已足够体现 v1 的核心"仪式感"。

Phase C（手势驱动）是交互模型的根本重构，建议作为独立 PR。
Phase D（坍塌）是高潮时刻，体验完整性依赖 Phase C 先完成。
