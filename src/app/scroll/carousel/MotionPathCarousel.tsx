"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { MotionPathCard } from './MotionPathCard';
import { bell } from './bell';
import { defaultCards, type CardData } from './cards';
import './MotionPathCarousel.css';


const DEFAULT_PATH =
  'M1115.94 0 C1297.33 38.97, 1626.89 444.65, 993.82 562.06 ' +
  'C407.37 670.82, 89.08 533.41, 0 436.16';

interface MotionPathCarouselProps {
  cards?: CardData[];
  title?: string;
  subtitle?: string;
  pathD?: string;        // SVG path 的 d 属性
  viewBox?: string;      // path 所在的 viewBox
}

export function MotionPathCarousel({
  cards = defaultCards,
  title = 'enjoyment range',
  subtitle = 'When and where SUNTY fits',
  pathD = DEFAULT_PATH,
  viewBox = '0 0 1366 603',
}: MotionPathCarouselProps) {
  // ──────────────────────────────────────────────────────────
  //  Refs - React 与 DOM 的桥梁
  // ──────────────────────────────────────────────────────────
  // 用 ref 而不是 state,因为我们要"直接操作"这些 DOM,
  // 而不是"声明它们应该长什么样"。state 会触发重渲染,ref 不会。
  const wrapRef  = useRef<HTMLElement>(null);          // 外层 200vh,用于计算滚动进度
  const stageRef = useRef<HTMLDivElement>(null);       // 卡片舞台,用它的尺寸映射坐标
  const pathRef  = useRef<SVGPathElement>(null);       // SVG path
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]); // 6 张卡片的 DOM 数组

  // ──────────────────────────────────────────────────────────
  //  Effect - 挂载滚动监听 + 计算 + 卸载清理
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    const wrap  = wrapRef.current;
    const stage = stageRef.current;
    const path  = pathRef.current;
    if (!wrap || !stage || !path) return;        // TS narrowing,后面就不用 ! 了

    const N = cards.length;
    // 每张卡片在路径上的"出发点",均分整条路径
    const baseOffsets = Array.from({ length: N }, (_, i) => i / N);

    // 从 viewBox 字符串里解析宽高,用于坐标映射
    const [, , vbW, vbH] = viewBox.split(' ').map(Number);

    // 新增 把 <path>转成 RawPath 并预缓存
    // 这两步在整个生命周期里只做一次
    const rawPath = MotionPathPlugin.getRawPath(path);
    MotionPathPlugin.cacheRawPathMeasurements(rawPath);

    /** 把全局滚动进度映射到每张卡片的视觉状态 */
    const updateCards = (progress: number) => {
      const rect = stage.getBoundingClientRect();
      const sx = rect.width  / vbW;
      const sy = rect.height / vbH;



      cardRefs.current.forEach((card, i) => {
        if (!card) return;

        // 该卡片在路径上的进度 = 基准偏移 + 滚动进度,环绕到 0~1
        let t = (baseOffsets[i] + progress) % 1;
        if (t < 0) t += 1;

        // 路径上的坐标 (viewBox 坐标系)
        const point = MotionPathPlugin.getPositionOnPath(
          rawPath, t, true
        ) as { x: number; y: number; angle: number };

        const focus = bell(t);
        const blur  = 1.5 * (1 - focus);

        gsap.set(card, {
          x: point.x * sx,
          y: point.y * sy,
          scale:   0.4 + 0.6 * focus,
          opacity: Math.max(0, focus * 1.2 - 0.1),
          filter:  blur > 0.01 ? `blur(${blur.toFixed(2)}em)` : 'none',
          zIndex:  Math.round(focus * 100),
        });
      });
    };

    /** 从 wrap 的位置算出滚动进度 0~1 */
    const getScrollProgress = (): number => {
      const r = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) return 0;
      return Math.max(0, Math.min(1, -r.top / total));
    };

    // rAF 节流:scroll 一秒可能触发几百次,但屏幕一秒只刷 60 次,
    // 所以多余的计算扔掉,只在下一帧前算一次。
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateCards(getScrollProgress());
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateCards(getScrollProgress()); // 首次渲染

    // ─── 清理函数:组件卸载或依赖变化时执行 ───
    // 没有这一步,切页面后监听器还在,会造成内存泄漏
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [cards, viewBox]); // 当卡片数量或 viewBox 变了,需要重新计算 baseOffsets

  // ──────────────────────────────────────────────────────────
  //  JSX - 只描述静态结构,运行时的 transform 全由 effect 注入
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
              // 注意:这里 ref 写成一个函数,React 会在挂载/卸载时调用它
              // (el === null 表示卸载)
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}