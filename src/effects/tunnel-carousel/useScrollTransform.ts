import { useEffect, type RefObject } from 'react';

interface UseScrollTransformOptions {
  /** 要被推动的元素 */
  targetRef: RefObject<HTMLElement | null>;
  /** 滚动 1px 在 3D 空间里推进多少 px */
  travelFactor?: number;
}

/**
 * 监听窗口滚动,把当前 scrollY × travelFactor 实时写到 target 的 translateZ。
 *
 * 没有用 state、没有触发任何重渲染 ——
 * 滚动每帧可能 60+ 次,走 React state 会卡。
 */
export function useScrollTransform({
  targetRef,
  travelFactor = 1.5,
}: UseScrollTransformOptions) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // 用 rAF 节流:scroll 一秒触发几百次,但只有 60 次屏幕刷新有意义
    let ticking = false;

    const updateTransform = () => {
      const scrollY = window.scrollY;
      const z = scrollY * travelFactor;
      target.style.transform = `translateZ(${z}px)`;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateTransform);
    };

    // 初始化一次,处理"页面加载时就已经滚动了一段距离"的情况
    updateTransform();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [targetRef, travelFactor]);
}