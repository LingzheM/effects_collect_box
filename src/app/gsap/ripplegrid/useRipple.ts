import { useCallback, type RefObject } from 'react';
import { gsap } from 'gsap';
import type { StaggerConfig } from './modes';

interface UseRippleOptions {
  /** 包含所有 .cell 的容器 */
  gridRef: RefObject<HTMLElement | null>;
}

/**
 * 返回一个 ripple 函数:传入 stagger 配置,就把容器内所有格子
 * 先瞬间归位(暗、缩小),再用一条 to() 批量"亮一下又暗下去"。
 */
export function useRipple({ gridRef }: UseRippleOptions) {
  const ripple = useCallback(
    (stagger: StaggerConfig) => {
      const container = gridRef.current;
      if (!container) return;

      // 拿到容器内所有格子(gsap.utils.toArray 把 NodeList 转成真数组)
      const cells = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll('.cell')
      );

      // 先打断正在进行的动画,避免叠加
      gsap.killTweensOf(cells);

      // 瞬间归位到"暗、缩小"的初始态
      gsap.set(cells, { backgroundColor: '#e0d6c4', scale: 0.7, opacity: 0.55 });

      // 一条 to() 驱动整批 —— 区别全在 stagger
      gsap.to(cells, {
        backgroundColor: '#c0532f',
        scale: 1.12,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,        // 亮 → 再暗,形成"波穿过"
        stagger,          // ← 这节课的全部
      });
    },
    [gridRef]
  );

  return { ripple };
}