import { useEffect, type RefObject } from "react";

interface UseScrollTransformOptions {
  /** 要被推动的元素 */
  targetRef: RefObject<HTMLElement | null>;
  /** 滚动 1px 在 3D空间里推进多少 px */
  travelFactor?: number;
}

export function useScrollTransform({
  targetRef,
  travelFactor = 1.5,
}: UseScrollTransformOptions) {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    // 用 rAF 节流：scroll 一秒触发几百次，但只有 60 次屏幕刷新有意义
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

    updateTransform();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [targetRef, travelFactor]);
}