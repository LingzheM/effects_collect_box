import { RefObject, useEffect } from "react";

interface UseParallaxScrollOptions {
  /** 触发滚动进度计算的容器（画廊本体） */
  containerRef: RefObject<HTMLElement | null>;
  /** 每一列的ref + 速度 */
  columns: ReadonlyArray<{
    ref: RefObject<HTMLElement | null>;
    speed: number;
  }>;
}

export function useParallaxScroll({
  containerRef,
  columns,
}: UseParallaxScrollOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
  
    const updatePositions = () => {
      const rect = container.getBoundingClientRect();
      // 画廊顶部进入视口下半部分后开始累计进度
      const progress = Math.max(0, -rect.top + window.innerHeight * 0.5);

      columns.forEach(({ ref, speed }) => {
        const el = ref.current;
        if (!el) return;
        // 用 translate3d 触发 GPU合成层，比 translateY 略快
        el.style.transform = `translate3d(0, ${-progress * speed}px, 0)`;
      });
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updatePositions);
    };

    // 首次同步一次（处理刷新后页面已经滚动到中间）
    updatePositions();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [containerRef, columns]);
}