"use client"

import { useRef, useState } from "react";
import {BookOpen} from 'lucide-react';
import { isDragging } from "framer-motion";

// 模拟数据
const TIMELINE_EVENTS = [
  { year: "1440", title: "活字印刷术", desc: "知识开始规模传播", icon: BookOpen, color: "from-amber-400 to-orange-600" }
]

const RADIUS = 320; // 螺旋的半径（决定圆柱的粗细）
const HEIGHT_SPAN = 1200; // 整个螺旋在屏幕上下跨越了总高度
const LOOPS = 2.5;  // 所有卡片在这个高度内绕了多少圈（螺距）

export default function HelixTimeline() {

  const [globalProgress, setGlobalProgress] = useState(0);

  // 物理拖拽相关 Refs
  const isDragging = useRef(false);

  // 用于在动画帧中直接读取/写入的进度值，避免React状态更新延迟

  const handlePointerDown = () => {

  }

  const handlePointerMove = () => {

  }

  const handlePointerUp = () => {

  }

  return (
    <div
      className="w-full h-screen bg-black overflow-hidden flex items-center justify-center select-none"
      style={{ perspective: '1200px', touchAction: 'none' }}  // perspective 提供 3D 透视深度，touch-action 禁用网页默认滚动
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/** 拖拽提示 */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 text-neutral-500 text-sm tracking-widest font-mono z-50 pointer-events-zone flex flex-col items-center gap-2">
        <div className="w-4 h-6 border-2 border-neutral-600 rounded-full flex justify-center p-1">
          <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"></div>
        </div>
        拖拽
      </div>

      {/** 3D 舞台容器 */}
      <div className="relative w-full h-full cursor-grab active:cursor-grabbing"
        // 稍微将整个圆柱往下俯视倾斜一点，让螺旋感更立体
        style={{ transformStyle: 'preserve-3d', transform: 'rotateX(-10deg)' }}
      >
        {/** 中心发光的“时间主轴”轨道指示器 */}
        <div
          className="absolute left-1/2 top-1/2 w-[2px] h-[1000px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(100, 100, 255, 0.4), rgba(255, 100, 255, 0.4), transparent)',
            boxShadow: '0 0 20px rgba(100, 100, 255, 0.5)',
            transform: 'translateZ(0px)'
          }}
        />
        {/** 渲染所有历史卡片 */}
        {TIMELINE_EVENTS.map((event, index) => {
          const totalCards = TIMELINE_EVENTS.length;

          // 1. 计算此卡片的原始进度（从0到1之间）
          const baseProgress = index / totalCards;

          // 2. 加上全局进度，并取模，确保它永远在 0~1 之间循环（完美的边缘回收逻辑）
          let currentProgress = (baseProgress + globalProgress) % 1.0;
          if (currentProgress < 0) currentProgress += 1.0;

          // 3. 映射到 Y 轴高度（从顶部飞入，到底部飞出，或者反之）
          const y = (currentProgress - 0.5) * HEIGHT_SPAN;

          // 4. 映射到旋转角度（绕圆柱多少圈）
          const angle = currentProgress * LOOPS * 360;

          // 5. 渐入渐出透明度（正弦波：0.5处最亮为1，0和1边缘处最暗为0）
          const alpha = Math.sin(currentProgress * Math.PI);

          // 6. 背面卡片虚化与变暗逻辑：面向我们的角度余弦值最大，背向最小
          const angleRad = angle * (Math.PI / 180);
          const facingFront = Math.cos(angleRad); // -1 （正后）到 1（正前）

          // 综合透明度：考虑上下边缘褪色，以及背面褪色
          const finalOpacity = alpha * (0.3 + 0.7 * ((facingFront + 1) / 2));
          // 根据面向前方的程度调整缩放，制造景深感
          const finalScale = 0.8 + 0.2 * ((facingFront + 1) / 2);

          const IconComponent = event.icon;
          return (
            <div
              key={event.year}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                // 核心螺旋轨迹公式
                // 先在 Y 轴上移动 -> 然后绕 Y 轴旋转 -> 最后推向圆柱表面（半径）
                transform:`
                  translateY(${y}px)
                  rotateY(${angle}deg)
                  translateZ(${RADIUS}px)
                  scale(${finalScale})
                `,
                opacity: finalOpacity,
                // z-index 处理，前面的卡片遮挡住后面的卡片
                zIndex: Math.round(facingFront * 100),
                transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {/** 卡片 UI 本身 */}
              <div className="w-64 h-80 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(0, 0, 0, 0.8)] relative overflow-hidden group">
                {/** 发光背景点缀 */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${event.color} rounded-full blur-[50]px opacity-20`}></div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${event.color} p-[1px] mb-4`}>
                    <div className="w-full h-full bg-neutral-900 rounded-[11px] flex items-center justify-center">
                      <IconComponent className="text-white w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 mb-2 font-mono">
                    {event.year}
                  </h3>
                  <h4 className="text-lg font-bold text-white mb-2 leading-tight">
                    {event.title}
                  </h4>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {event.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}