import { useGSAP } from "@gsap/react";
import { gsap } from "gsap/gsap-core";
import type { RefObject } from "react";

interface UseBreathingBackgroundOptions {
  /** 要呼吸效果的元素 */
  targetRef: RefObject<HTMLElement | null>;

  /** 呼吸到的目标颜色 */
  toColor?: string;

  /** 单次呼吸时长 */
  duration?: number;
}

export function useBreathingBackground({
  targetRef,
  toColor = '#161b22',
  duration = 2,
}: UseBreathingBackgroundOptions) {
  useGSAP(
    () => {
      const el = targetRef.current;
      if (!el) return;

      gsap.to(el, {
        backgroundColor: toColor,
        duration,
        repeat: -1, // 无限循环
        yoyo: true, // 来回播放
      });
    },
    { dependencies: [toColor, duration] }
  );
}