# Session: v1 空间环境 — 是否解耦 & 独立 background 组件设计

日期：2026-05-05
关联：2026-05-05_burn-v1-spatial-gap.md

---

## 核心问题

v1 定义的空间环境（暗色纹理背景 + 火光照亮背景）是否必须和 burn 耦合？
能否作为 category: background 的独立组件？怎么设计、怎么实现？

---

## 拆解：v1 空间环境是由两个独立概念组成的

**概念 A：暗色纹理背景本身**
- 极暗底色（deep ambient）
- 有质感（木纹 / 冷磨砂石材）
- 无需任何交互，自主播放
- 与 burn 零关系

**概念 B：火光穿洞照亮背景**
- 需要知道"哪里有洞"（burned holes）
- 洞的位置由 burn 的 uNoise + uThreshold + uOrigin 决定
- 是 burn 的 side-effect，天然和 burn 耦合

**结论：**
- 概念 A → 完全可以独立，适合做 category: background 组件
- 概念 B → burn 专属，属于 burn-paper Phase A.2 的实现细节，不应抽出

独立组件不做概念 B。概念 B 的"光穿洞"效果，用通用的"光源数组接口"替代：
独立时，光源 = 鼠标/指针；集成到 burn 时，光源 = 火焰位置（可选注入，非必须）。

---

## 独立组件定位

**slug:** `dark-ambient-env`
**title:** `Dark Ambient Environment`
**category:** `background`
**tech:** `["webgl", "shader"]`
**style:** `["dark", "ambient"]`
**description:** 暗色石材纹理 WebGL 场景，光标作为暖色点光源实时照亮背景；无需交互自主呼吸，可作为其他效果的舞台

这个效果本身有意义：它是一个"有质感的黑暗空间"，光标移动时背景被局部照亮，像手持烛火在黑暗中移动。
不依赖 burn，独立成立。

---

## 设计方案

### 光源抽象

把"什么照亮背景"从 burn 细节中抽象为通用接口：

```
type Light = {
  x: number        // UV 空间 [0, 1]
  y: number
  intensity: number // [0, 1]
  color?: [r, g, b] // 归一化，默认暖橙
  radius?: number   // 衰减半径，默认 0.35
}
```

独立使用时：鼠标位置 → 单个 Light，组件内部自管理
集成到 burn 时：burn-paper 通过 props 传入 lights 数组（可选，不强制）

组件接口：
```tsx
interface DarkAmbientEnvProps {
  lights?: Light[]        // 外部光源；不传时默认鼠标模式
  className?: string
  style?: React.CSSProperties
}
```

这样组件既能独立工作，又不拒绝外部数据注入。但 burn-paper 不需要使用这个接口——
burn 的"火光穿洞"是背景 shader 读取 burn uniforms，是 burn-paper 内部实现（Phase A.2），
不涉及这个独立组件。两者是平行关系，不是组合关系。

### Shader 设计

**Vertex Shader：** 标准直通，无顶点变形（背景是静态平面）

**Fragment Shader 分层：**

```
layer 1: 程序化暗色底纹
  - GPU 侧实时 FBM（低频，3 层 octave 即可，背景不需要 burn 那种精度）
  - 目标：看起来像冷色调磨砂石材或细腻混凝土
  - 色值范围：luminance 0.02 ~ 0.08（极暗，保留对比空间）

layer 2: 光源照亮（支持最多 N 个 Light）
  - 对每个 Light：计算到当前像素的距离 d
  - 光照强度 = intensity * smoothstep(radius, 0.0, d)  // 径向衰减
  - 光照颜色 mix 到底纹颜色（additive-ish：底纹色 + 光照色 * 强度）
  - 多个 Light 叠加（循环累加）

layer 3: 渐晕（Vignette）
  - 屏幕边缘进一步压暗
  - 公式：vignette = smoothstep(0.4, 1.0, distance(uv, vec2(0.5)))
  - 最终色 *= (1.0 - vignette * 0.6)

layer 4: 自主呼吸动画
  - 底纹 FBM 的 UV 随 uTime * 0.01 缓慢漂移（视觉上像空气流动）
  - 不是闪烁，是极慢的质感位移
```

### Uniform 列表

| Uniform | 类型 | 说明 |
|---------|------|------|
| uTime | float | 自主动画驱动 |
| uMouse | vec2 | 鼠标 UV（默认光源模式用） |
| uLightCount | int | 外部 Light 数量（0 = 鼠标模式）|
| uLightPos[N] | vec2[] | 光源位置数组 |
| uLightIntensity[N] | float[] | 光源强度数组 |
| uLightColor[N] | vec3[] | 光源颜色数组 |
| uLightRadius[N] | float[] | 光源衰减半径数组 |

N 上限：8（超出忽略）。鼠标模式下 uLightCount = 1，uLightPos[0] = uMouse。

---

## Phase / Task 定义（独立组件实现）

### Phase 1 · 场景基础 + 底纹

**Task 1.1 · Renderer 初始化**
- Step 1：WebGLRenderer，alpha: false（背景不需要透明）
- Step 2：OrthographicCamera(-1, 1, 1, -1)，Z = 1
- Step 3：PlaneGeometry(2, 2, 1, 1)——背景无需细分（无顶点变形）
- Step 4：devicePixelRatio 限制 1.5

**Task 1.2 · GPU 侧 FBM 底纹**
- Step 1：在 Fragment Shader 中实现 2D Simplex Noise（或 value noise，无需高精度）
- Step 2：FBM 叠加 3 层（octave = 3，frequency 递增，amplitude 递减）
- Step 3：输出值映射到 [0.02, 0.08] 亮度范围（保持极暗基调）
- Step 4：纹理 UV 加入缓慢时间偏移：`uv_noise = vUv + uTime * 0.008`

为什么这里用 GPU 侧而非 burn 用的 CPU 预计算？
burn 需要 CPU 侧 FBM 用于粒子生成（CPU 要读噪声决定粒子生成位置），背景不需要 CPU 读取，
GPU 实时计算足够且省去纹理上传开销。背景 FBM 精度要求低，3 层足矣。

**Task 1.3 · 渐晕**
- Step 1：`float vignette = smoothstep(0.45, 0.95, length(vUv - 0.5) * 1.6)`
- Step 2：最终颜色 `*= (1.0 - vignette * 0.65)`
- Step 3：调参保证中心区域不受渐晕影响，仅压暗边缘

---

### Phase 2 · 光源系统

**Task 2.1 · 鼠标光源（默认模式）**
- Step 1：监听 mousemove / pointermove，实时更新 uMouse uniform（归一化 UV 坐标）
- Step 2：鼠标离开画布 → uMouse 保留在最后位置（不消失）
- Step 3：鼠标进入 → 无过渡（瞬间）；光源跟随无延迟（不需要 lerp，立即更新）

**Task 2.2 · Fragment Shader 光照计算**
- Step 1：定义 `float computeLight(vec2 pixelUv, vec2 lightPos, float radius)` 函数
  - `d = distance(pixelUv, lightPos)` —— 注意 UV 是 [0,1]，x/y 比例需修正（乘以宽高比）
  - `return smoothstep(radius, 0.0, d)`
- Step 2：光照颜色叠加：`finalColor += lightColor * lightIntensity * lightValue`
- Step 3：防止过曝：`finalColor = min(finalColor, vec3(0.35, 0.28, 0.20))`
  （最亮处不超过低亮度暖橙，维持"黑暗中的烛光"感，而非"泛光"）

**Task 2.3 · 宽高比修正（Aspect Ratio Correction）**
重要：UV 坐标是 [0,1] 正方形，但屏幕宽高比不是 1:1。
距离计算不修正会导致光照圈变成椭圆。
- Step 1：在 uniform 中传入 `uAspect: float = width / height`
- Step 2：距离计算前：`vec2 correctedUv = vec2(pixelUv.x * uAspect, pixelUv.y)`
  `vec2 correctedLight = vec2(lightPos.x * uAspect, lightPos.y)`
- Step 3：用修正后的坐标做 distance

**Task 2.4 · 外部 Light 数组注入（可选扩展）**
- Step 1：props 接受 `lights?: Light[]`
- Step 2：useEffect 监听 lights 变化 → 更新 uLightCount + uLightPos[] 等 uniforms
- Step 3：lights 不传时：uLightCount = 0，组件自用鼠标作为单一光源
- Step 4：lights 传入时：uLightCount = lights.length，不使用鼠标 uniform
- 上限：N = 8，超出截断（GLSL 数组需编译时确定大小）

---

### Phase 3 · 自主动画 + 交互增强

**Task 3.1 · 自主呼吸**
- Step 1：uTime 驱动底纹 UV 漂移（Task 1.2 Step 4 已包含）
- Step 2：（可选）光源半径随 sin(uTime * 0.4) 轻微脉动：`radius = baseRadius * (1.0 + 0.08 * sin(uTime * 0.4))`
- Step 3：保证即使鼠标静止，场景仍有微弱生气——"活的静止"

**Task 3.2 · 点击脉冲（可选）**
- Step 1：记录点击 UV 坐标 + 点击时间戳
- Step 2：在 Fragment Shader 中：`float age = uTime - clickTime`
  `float ring = abs(distance(uv, clickPos) - age * ringSpeed)` —— 扩散圆环
  `float pulse = smoothstep(0.02, 0.0, ring) * smoothstep(1.5, 0.0, age)`
- Step 3：脉冲颜色为极淡的暖白，叠加到最终颜色上
- Step 4：最多同时 4 个脉冲（uniform 数组），旧的淡出后复用槽位

---

### Phase 4 · React 集成

**Task 4.1 · 组件骨架**
- 位置：`src/app/background/dark-ambient-env/dark-ambient-env.tsx`
- 接受 props：`{ lights?: Light[], className?: string, style?: CSSProperties }`
- useEffect 内：初始化 Three.js，挂载到 div，返回 cleanup
- 无 useState（全部通过 ref + uniform 驱动，避免 React re-render）

**Task 4.2 · 注册到 effects.ts**
```ts
{
  slug: "dark-ambient-env",
  title: "Dark Ambient Environment",
  category: "background",
  tech: ["webgl", "shader"],
  style: ["dark", "ambient"],
  description: "暗色石材纹理 WebGL 场景，光标作为暖色点光源；可作为其他效果的空间舞台",
  createdAt: "2026-05-05",
}
```

**Task 4.3 · page.tsx**
- 全屏展示，直接渲染 `<DarkAmbientEnv />` 铺满 100vw × 100vh
- 页面无额外 UI，纯效果展示

---

## 与 burn-paper 的关系（澄清）

两者是平行关系，不是组合关系：

| | DarkAmbientEnv | burn-paper Phase A.2 |
|--|---|---|
| 部署位置 | background/dark-ambient-env | click/burn-paper |
| 背景来源 | 自身的 PlaneGeometry + shader | burn-paper 内部新增的背景 Mesh |
| 光源来源 | 鼠标（or 外部 lights prop） | burn 的 uNoise + uThreshold（shader 内部计算） |
| 依赖关系 | 无 | 依赖 burn uniforms |

burn-paper 的 Phase A.2 不使用 DarkAmbientEnv 组件，而是在 burn-paper.tsx 内新增一个背景 PlaneGeometry + ShaderMaterial，
这个背景 Shader 与 burn Shader 共享 uniform 对象（Three.js uniform 引用，直接共享，零开销）。

如果未来想让 DarkAmbientEnv 在 burn 场景中使用，可以通过 lights prop 注入采样点，
但这属于进阶集成，当前不需要。

---

## 实现顺序

```
Task 1.1 → 1.2 → 1.3（能看到暗色底纹）
→ Task 2.1 → 2.2 → 2.3（鼠标移动，背景局部点亮）
→ Task 3.1（确认自主呼吸）
→ Task 4.1 → 4.2 → 4.3（注册 + 独立页面）
→ Task 2.4（lights prop，可选，按需）
→ Task 3.2（点击脉冲，可选）
```

MVP：Phase 1 + Phase 2.1~2.3 + Phase 4 = 完整可展示的独立 background 效果。
