"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { MotionPathCard } from "./Card";
import { defaultCards, type CardData } from "./cards";
import MotionPathPlugin from "gsap/MotionPathPlugin";
import './Carousel.css'

gsap.registerPlugin(MotionPathPlugin);

const DEFAULT_PATH = 
  'M1115.94 0 C1297.33 38.97, 1626.89 444.65, 993.82 562.06' + 
  'C407.37 670.82, 89.08 533.41, 0 436.16';

interface CarouselProps {
  cards?: CardData[];
  title?: string;
  subtitle?: string;
  pathD?: string; // SVG path的 d属性
  viewBox?: string; // path 所在的 viewBox
}

export default function Carousel({
  cards = defaultCards,
  title = 'enjoyment range',
  subtitle = 'When and where',
  pathD = DEFAULT_PATH,
  viewBox = '0 0 1366 603',
}: CarouselProps) {
  // ──────────────────────────────────────────────────────────
  //  Refs - React 与 DOM 的桥梁
  // ──────────────────────────────────────────────────────────
  const wrapRef = useRef<HTMLElement>(null);  // 外层 200vh，用于计算滚动进度
  const stageRef = useRef<HTMLDivElement>(null);  // 卡片舞台，用它的尺寸映射坐标
  const pathRef = useRef<SVGPathElement>(null); // SVG path
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]); // 卡片的DOM数组

  // ──────────────────────────────────────────────────────────
  //  Effect - 挂载滚动监听 + 计算 + 卸载清理
  // ──────────────────────────────────────────────────────────

  return (
    <section className="motionpath-wrap" ref={wrapRef}>
      <div className="motionpath-sticky">
        <div className="motionpath-subtitle">{subtitle}</div>
        <h2 className="motionpath-title">{title}</h2>

        <div className="motionpath-stage" ref={stageRef}>
          <svg
            className="motionpath-track"
            viewBox={viewBox}
            preserveAspectRatio="none"
          >
            <path ref={pathRef} d={pathD} />
          </svg>

          {cards.map((card, i) => (
            <MotionPathCard 
              key={i}
              {...card}
              // 注意：这里 ref 写成一个函数，React会在挂载/卸载时调用它
              // (el === null 表示卸载)
              ref={(el) => {
                cardRefs.current[i] = el;
              }} 
            />
          ))}
        </div>
      </div>
    </section>
  )
}