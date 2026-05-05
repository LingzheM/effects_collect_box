**场景 B：沉浸式全屏模式（阅后即焚）**，我们的设计重心就要从“效率”转向**“仪式感”与“不可逆性”**。

在 **Issara Willenskomer** 的动态逻辑中，这种场景需要极高的**“感官保真度”**。用户不仅仅是在滑动屏幕，他是在亲手开启一个毁灭程序。

---

## 1. 空间环境：构建“黑暗中的焦点”

为了实现美感，背景不能是虚无的。

*   **视觉基调：** 建议采用极暗的氛围（Dark Ambient）。背景可以是有微弱质感的“深木纹”或“冷磨砂石材”。
*   **光影逻辑：** 纸片本身应当是唯一的点光源。当燃烧发生时，火光应该能**“溢出”**并照亮背景的纹理。
*   **深度描述：**
    *   **纸片：** 位于 Z 轴 0 位，带有轻微的浮动动画（Floating Idle）。
    *   **背景：** 位于 Z 轴 -5 位。
    *   **环境光：** 当手指划过，纸片产生不规则空洞，背景通过空洞被**局部照亮**。

---

## 2. 深度拆解：沉浸式燃烧的“三部曲”

针对“阅后即焚”，我们需要把效果描述得更有层次感：

### 第一阶段：受热预警（The Pre-Burn）
当指尖刚触碰纸张但未滑动时。
*   **描述：** 触碰点周围出现微弱的**色彩偏移（Chromatic Aberration）**和**热浪扭曲**。
*   **目的：** 告诉用户，这里能量正在积聚。

### 第二阶段：熔蚀与空洞（The Erosion & Void）
指尖滑动，纸张被物理撕开。
*   **描述：**
    *   **边缘：** 产生一种“向内卷曲”的 3D 效果。在 WebGL 中通过修改顶点，让侵蚀边缘沿法线翻转。
    *   **焦炭残留：** 消失的边缘不应该是干净的，要留下一些半透明、细碎的黑色“碳化物”纹理。
    *   **空洞揭示：** 随着空洞扩大，下方隐藏的**底层背景**（或另一张提示“已销毁”的纹理）逐渐显露。

### 第三阶段：余烬升腾（The Ember Ascent）
这是沉浸感的高潮。
*   **描述：** 
    *   产生带有**重力反转**属性的粒子系统。
    *   粒子在上升过程中由亮橙色变为深灰，最后在空气中**消失（Fade out）**。
    *   **关键描述：** “粒子的密度应与滑动速度成正比，产生一种手动撕裂物质的物理反馈。”

---

## 3. 核心技术参数（写给开发端的 Spec）

为了让执行端（WebGL/Three.js 开发者）精准复刻，你需要提供这些定量的描述：

| 维度 | 描述建议 (Instruction) | 关键参数 |
| :--- | :--- | :--- |
| **噪声类型** | 采用 **FBM (Fractal Brownian Motion)** 噪声。 | 频率 (Frequency): 4.0 - 6.0 |
| **边缘过渡** | 建立 3 层 Color Ramp：`White(Hot)` -> `Orange(Fire)` -> `Black(Char)`。 | 宽度: UV 坐标的 0.02 单位 |
| **顶点偏移** | 燃烧线周围的顶点需沿 Z 轴偏移，模拟受热卷曲。 | 偏移量: $Max\_Z = 0.1$ |
| **后处理** | 必须添加 **Bloom Pass**。 | 阈值: 0.8, 强度: 1.5 |

---

## 4. 关于“不规则空洞”的疑问解答


*   **视觉平衡：** 纸片本身可以设计得有质感（比如带有纤维纹理的羊皮纸感）。
*   **互动留痕：** 如果用户只是划开了一个洞就停下了，那个洞的边缘应该还在**微微跳动（Shimmering）**，就像余烬未熄。这种“动态的静止”能极大地提升沉浸感。

---

### Issara 的设计建议：

既然是“阅后即焚”，我们可以增加一个**终极反馈**：
当纸张被烧掉超过 **80%** 的面积时，触发一个**“结构性坍塌”**动画——剩下的残片不再等待用户互动，而是自动加速化为灰烬，并伴随一个全局的相机抖动（Camera Shake）或模糊（Blur）。

# v2补足

站在 **Issara Willenskomer** 的视角，一套“通用的特效描述”绝不仅仅是形容词（如“酷炫”、“丝滑”），而是一套**对象属性随时间变化的逻辑协议**。

对于开发者（执行端）来说，一份优秀的特效描述应该像一份“配方”，包含：**触发条件、属性维度、变化曲线、以及空间关系**。

针对你提出的“纸片/便签燃烧”效果，如果我们要用 WebGL 或 Three.js 来实现，描述不能只停留在“纸着火了”，而要将其拆解为**视觉逻辑（Design Logic）**与**数学实现（Technical Specs）**。

---

## 1. 什么是通用的特效描述？（The Framework）

在动态设计系统中，我们通常用 **Object-Action-Property (OAP)** 模型来描述一个 Effect：

*   **对象 (Object)：** 具体的元素（如 `StickyNote_Mesh`）。
*   **动作 (Action)：** 发生了什么（如 `Erode` 侵蚀, `Warp` 扭曲, `Emit` 发射）。
*   **属性 (Property)：** 哪些参数在变？（如透明度、顶点位移、噪声阈值）。
*   **时间/缓动 (Timing/Easing)：** 变化的节奏（如 `Ease-in-out`，或基于物理的波形）。

---

## 2. 深度拆解：便签纸燃烧效果

我们要把“燃烧”这个感性的视觉过程，拆解为执行端可以写成 Shader（着色器）代码的三个核心层级。

### 第一层：边缘侵蚀（The Erosion Layer）
这是燃烧的“灵魂”。在 WebGL 中，我们不直接裁剪几何体，而是通过**噪声（Noise）**来控制像素的可见性。

*   **描述：** 使用一张二维 **Simplex Noise** 作为阈值贴图。随着 `Time` 参数增加，像素的 `Alpha` 值根据噪声强度从 1 变为 0。
*   **关键点：** 燃烧不是均匀的，边缘必须有“焦灼感”。
*   **执行指令：** 
    *   定义一个变量 `vBurnAlpha`。
    *   当 `noise_value < time_threshold` 时，`discard` 像素。
    *   在消失的边缘（阈值附近的 0.05 范围内），将颜色混合为亮橙色 $\rightarrow$ 深红色 $\rightarrow$ 黑色，模拟发热的碳化层。

### 第二层：空间扭曲（The Deformation Layer）
真实的纸张在受热时会卷曲。

*   **描述：** 顶点着色器（Vertex Shader）中，根据燃烧进度对 `Position.z` 进行非线性位移。
*   **关键点：** 越靠近“燃烧线”的区域，由于热空气上升和纤维收缩，位移越大。
*   **执行指令：**
    *   利用相同的噪声函数偏移顶点坐标。
    *   $Position.z += \sin(Position.x * frequency + Time) * noise\_value * intensity$。
    *   这样纸片看起来像是在火焰中挣扎扭动，而不仅仅是平面消失。

### 第三层：粒子与辉光（The Particle & Glow Layer）
增加美感和真实度。

*   **描述：** 在侵蚀边缘的坐标点上，随机生成向上飘散的点阵粒子（灰烬/火星）。
*   **关键点：** 粒子的生命周期需与 `time_threshold` 同步，且带有扰动（Turbulence）。
*   **执行指令：**
    *   使用 **Point Cloud**。
    *   粒子初速度由 $v_{initial} + Brownian\_Motion$ 决定。
    *   后处理层（Post-processing）增加 **Bloom** 效果，让边缘的橙色产生发光感。

---

## 3. 技术路径建议 (Technical Roadmap)

对于这种高度自定义的视觉效果，**Three.js + 自定义 Shader (GLSL)** 是最合适的方案。

### 为什么不直接用现成的库？
因为燃烧涉及复杂的顶点偏移和像素剔除，标准材质（MeshStandardMaterial）无法做到。你需要编写：
1.  **Vertex Shader：** 负责纸片的“受热卷曲”变形。
2.  **Fragment Shader：** 负责“噪声侵蚀”和“焦边上色”。



### 描述示例（写给开发者的文档）：
> **效果：纸片燃烧消失**
> *   **输入：** 原生便签纹理，噪声频率 4.0，燃烧速度 0.5 unit/s。
> *   **逻辑：** 
>     1. 基于 UV 坐标采样噪声，通过 `step` 函数实现 Alpha 剪裁。
>     2. 在 `step` 边缘处，叠加 `pow(edge, 3.0)` 的发光色带（Color Ramp: #FFD700 -> #FF4500 -> #333333）。
>     3. 顶点位移强度与 Alpha 进度成正比，最大位移 0.2 坐标单位。


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