## 燃烧模拟方案设计

核心组件：

Noise Function：在 Shader 中直接生成动态噪声。

Step & Smoothstep：用来界定“已烧毁”、“正在烧”和“未烧”三个区域。

视觉拆解：

燃烧带（The Burn Front）：通过两条阈值线切出一条缝隙，赋予发光的橙红色。

焦黑带（Char Edge）：在燃烧带后方增加一层深灰色过渡。

扭曲（Distortion）：利用噪声对 UV 坐标进行微调，让纸张边缘在消失时产生卷曲和抖动的错觉。

---

### Phase 0 · 场景基础

**Task 0.1 · Renderer 初始化**
- Step 1：WebGLRenderer，开启 `alpha: true`，toneMappingExposure 调低（火焰自身发光，不宜过曝）
- Step 2：Camera 正交 vs 透视决策 → 纸张用正交 OrthographicCamera，铺满画面
- Step 3：确认目标分辨率与 `devicePixelRatio` 策略（移动端限制为 1.5）

**Task 0.2 · 平面几何体**
- Step 1：`PlaneGeometry(2, 2, 1, 1)`，UV 自动 [0,1]²，正好覆盖 NDC
- Step 2：确认 UV 原点对齐方向（纸的左上角 or 中心 → 决定燃烧起点坐标系）

---

### Phase 1 · 噪声纹理生成

**Task 1.1 · 选择噪声类型**
- Step 1：评估选项——Classic Perlin / Simplex / FBM 叠加
- Step 2：决策：用 **FBM（Fractional Brownian Motion）= 多倍频 Perlin 叠加**，获得自然纸张焦痕感
- Step 3：确定倍频数（octaves）：4～6 层，频率 × 2，振幅 × 0.5

**Task 1.2 · 噪声实现位置决策**
- Step 1：Option A — CPU 侧 JS 生成 → 写入 `DataTexture`（512×512 Float32）→ 上传 GPU，一次性
- Step 2：Option B — GPU 侧在 fragment shader 里实时计算（无需纹理，节省内存）
- Step 3：决策：**Option A**（预生成），理由：FBM 计算量大，fragment 实时算会在低端设备掉帧；纹理采样更快且可加 mipmap

**Task 1.3 · CPU 侧 FBM 生成**
- Step 1：实现 `grad2D(ix, iy)` → 伪随机梯度向量（hash 函数）
- Step 2：实现单层 `perlin2D(x, y)` → 双线性插值 + 平滑曲线（fade = 6t⁵−15t⁴+10t³）
- Step 3：实现 `fbm(x, y, octaves)` → 累加各倍频，归一化到 [0, 1]
- Step 4：遍历 512×512 像素，填入 `Float32Array`，构造 `DataTexture`（format: RedFormat，type: FloatType）
- Step 5：设 `texture.wrapS = texture.wrapT = RepeatWrapping`，minFilter = LinearMipmapLinear

**Task 1.4 · 噪声纹理验证**
- Step 1：临时用一个 `MeshBasicMaterial` 把噪声纹理显示到屏幕 → 目视检查是否有连续渐变感
- Step 2：检查值域是否真正覆盖 [0, 1]（避免噪声集中在 0.4-0.6 导致燃烧动态范围窄）
- Step 3：必要时做线性 remap：`v = (v - min) / (max - min)`

---

### Phase 2 · Shader 核心设计

**Task 2.1 · Uniform 列表规划**
- Step 1：列出所有需要的 uniform：
  - `uNoise`：sampler2D，噪声纹理
  - `uThreshold`：float，燃烧前沿位置 [0→1]
  - `uEdgeWidth`：float，火焰颜色带宽度（建议 0.04～0.08）
  - `uTime`：float，用于火焰抖动动画
  - `uPaperTex`：sampler2D（可选，纸张贴图）
  - `uOrigin`：vec2，燃烧起点 UV 坐标
  - `uBurnDir`：int 或 float，控制扩散方向偏好（0=各向同性，1=带方向性）
- Step 2：确认哪些 uniform 需要每帧更新（uThreshold、uTime），哪些静态（uNoise、uPaperTex）

**Task 2.2 · 阈值采样策略**
- Step 1：朴素方案：直接采样 `noise(uv)` 与 `uThreshold` 比较 → 烧毁方向从左到右（因为噪声值分布均匀）
- Step 2：改进方案：加入距离场权重 → `float d = distance(uv, uOrigin)` → 有效采样值 = `noise(uv) + d * k`，让燃烧从起点扩散而非全局随机
- Step 3：决策参数 `k`：控制距离权重强度（k=0 → 全局随机点火；k=1 → 强方向性扩散）

**Task 2.3 · Fragment Shader 分支逻辑**

三个区域的判断顺序与实现：

- Step 1：**已烧毁区** — `effectiveNoise < threshold - edgeWidth`
  - `discard`（完全透明，纸张消失）
  
- Step 2：**火焰前沿带** — `threshold - edgeWidth ≤ effectiveNoise ≤ threshold`
  - 计算局部归一化位置：`t = (effectiveNoise - (threshold - edgeWidth)) / edgeWidth`，范围 [0,1]
  - t=0（靠近焦炭）→ t=1（靠近未烧区）

- Step 3：**颜色渐变设计**（在 t 上分段 smoothstep）
  - `t ∈ [0.00, 0.25]`：黑色炭 `(0.02, 0.01, 0.01)` → 深棕红 `(0.15, 0.03, 0.01)`
  - `t ∈ [0.25, 0.60]`：深棕红 → 橙红 `(0.90, 0.25, 0.02)`
  - `t ∈ [0.60, 0.85]`：橙红 → 亮橙 `(1.00, 0.55, 0.05)`
  - `t ∈ [0.85, 1.00]`：亮橙 → 亮黄白 `(1.00, 0.92, 0.40)`（最高温前沿）

- Step 4：**未烧到区** — `effectiveNoise > threshold`
  - 输出纸张颜色（纯白 or 采样 uPaperTex）
  - Alpha = 1.0

**Task 2.4 · 火焰前沿抖动动画**
- Step 1：在前沿带内叠加高频噪声扰动 → `noise(uv * 8.0 + uTime * 0.4)` 轻微偏移 t 值
- Step 2：控制抖动强度（避免过强让边界模糊到失去锐感）
- Step 3：抖动只影响颜色插值，不影响 discard 判断（保持几何边界稳定）

**Task 2.5 · 发光（Bloom 替代方案）**
- Step 1：Option A — 后处理 `UnrealBloomPass`（真实物理 bloom）
- Step 2：Option B — Shader 内部 fake glow：前沿带颜色乘以 `emissive = mix(1.0, 3.5, t)` → HDR 值超过 1，配合 ToneMapping 出现过曝感
- Step 3：决策：先用 Option B（零依赖），后期可升级 Option A

---

### Phase 3 · 燃烧动画控制

**Task 3.1 · Threshold 随时间演进**
- Step 1：线性推进：`threshold += speed * deltaTime`，speed ≈ 0.025/s
- Step 2：缓动方案（更自然）：speed 本身随时间轻微波动 → `speed * (1 + 0.2 * sin(time * 0.7))`
- Step 3：边界条件：threshold 达到 1.0 + edgeWidth → 停止更新，纸张完全消失

**Task 3.2 · 交互控制**
- Step 1：点击/触摸屏幕 → 重置 threshold = 0，重新开始燃烧
- Step 2：（可选）鼠标位置 → 动态更新 `uOrigin`，点哪里从哪里点火
- Step 3：（可选）滑块控制燃烧速度 `speed`

**Task 3.3 · 多点同时点火**
- Step 1：设计方案：多个 `uOrigin[N]` 数组 uniform，各自独立距离场
- Step 2：合并策略：`effectiveNoise = noise(uv) + min(d1, d2, d3) * k`（取最近起点）
- Step 3：实现简化版（前 2 点）后再扩展

---

### Phase 4 · 纸张视觉增强

**Task 4.1 · 纸张本体渲染**
- Step 1：纯白底色 + 轻微 warm tint `(1.0, 0.98, 0.94)`
- Step 2：（可选）Canvas 预生成纸张纹理 → 细腻颗粒感（类似 Phase 0 桌面木纹做法）
- Step 3：（可选）印刷文字 / 图案作为 `uPaperTex`，让用户看到"烧掉内容"的过程

**Task 4.2 · 卷曲形变（进阶）**
- Step 1：Vertex Shader 里，已烧毁区顶点 Y 轻微上翘（模拟纸张受热卷边）
- Step 2：需要把 PlaneGeometry 细分（segments 128×128）
- Step 3：卷曲量 = `f(threshold - noise(uv))`，仅在前沿附近形变，已烧区无形变
- Step 4：权衡：形变 + discard 同时存在时 z-fighting 风险 → 需要 `polygonOffset`

---

### Phase 5 · 烟雾与余烬（可选层）

**Task 5.1 · 烟雾粒子**
- Step 1：`Points` 系统，粒子从焦炭区边界生成
- Step 2：粒子初速度：向上 + 少量随机水平漂移
- Step 3：粒子颜色：深灰 `(0.15, 0.14, 0.13)` → 随生命衰减到透明
- Step 4：粒子在 shader 内用 `gl_PointCoord` 画柔边圆点（高斯衰减）

**Task 5.2 · 余烬飞溅**
- Step 1：少量粒子从前沿高速弹出（橙色，速度是烟的 5×）
- Step 2：受重力影响（vy += -9.8 * dt * 0.02）
- Step 3：落地后颜色立即变黑，scale 缩小消失

---

### Phase 6 · 性能与调试

**Task 6.1 · 性能指标**
- Step 1：目标 60fps @ 1080p，噪声纹理 512² 为基准
- Step 2：若掉帧：降级噪声纹理到 256²，检查是否 fillrate 瓶颈

**Task 6.2 · Debug 辅助**
- Step 1：`?debug=noise` URL 参数 → 渲染纯噪声纹理
- Step 2：`?debug=threshold` → 渲染阈值热力图（蓝=已烧，红=前沿，白=未烧）
- Step 3：屏幕左上角显示当前 `threshold` 值 + FPS

**Task 6.3 · 跨设备兼容**
- Step 1：检测 `renderer.capabilities.isWebGL2` → 降级路径
- Step 2：`FloatType DataTexture` 在部分移动端不支持 → fallback 到 `UnsignedByteType`，归一化时乘 `1/255`
- Step 3：测试清单：Chrome/Safari/Firefox × Desktop/iOS/Android

---

### 实现顺序建议

```
Phase 0 → Phase 1.1~1.3 → Phase 2.1~2.3（静态阈值先跑通）
→ Phase 3.1（动画）→ Phase 2.4（抖动）→ Phase 4.1
→ Phase 2.5 / 3.2 / 4.2 / Phase 5（按优先级选择）
→ Phase 6
```

最小可运行版本（MVP）只需要 Phase 0 + 1 + 2.1~2.3 + 3.1，其余全是增量增强。