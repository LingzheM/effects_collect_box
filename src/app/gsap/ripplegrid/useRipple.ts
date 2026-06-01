import { RefObject, useCallback } from "react";
import { StaggerConfig } from "./modes";

interface UseRippleOptions {
  gridRef: RefObject<HTMLElement | null>;
}

export function useRipple({ gridRef }: UseRippleOptions) {
  const ripple = useCallback(
    (stagger: StaggerConfig) => {
      const container = gridRef.current;
      if (!container) return;

      // 拿到容器内所有格子
      const cells = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll('.cell')
      );

      // 先打断正在进行的动画
      gsap.killTweensOf(cells);

      // 瞬间归位到“暗，缩小”的初始状态
      gsap.set(cells, { backgroundColor: '#e0d6c4', scale: 0.7, opacity: 0.55 });
    },
    [gridRef]
  );

  return { ripple };
}