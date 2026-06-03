import { useGSAP } from "@gsap/react";
import { RefObject } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { getDepthZone } from "./creatures";

gsap.registerPlugin(ScrollTrigger);

interface UseDiveTimelineOptions {
  /** 被钉住的下潜场景容器 */
  sceneRef: RefObject<HTMLElement | null>;
  /** HUD 的两个文本节点 */
  depthRef: RefObject<HTMLElement | null>;
  zoneRef: RefObject<HTMLElement | null>;
}

export function useDiveTimeline({
  sceneRef,
  depthRef,
  zoneRef
}: UseDiveTimelineOptions) {
  useGSAP(
    () => {
      const state = { depth: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sceneRef.current,
          start: 'top top', // 场景顶碰到视口顶时开始
          end: '+=3000',  // 再滚 3000px 结束
          scrub: 1, //进度绑死滚动（1 = 平滑跟随）
          pin: true, // 钉住场景，页面穿过它
        }
      });
      // 背景变
      tl.to('.bg', { backgroundColor: '#2f86b8', duration: 2 }, 0)
        .to('.bg', { backgroundColor: '#16527e', duration: 2 }, 2)
        .to('.bg', { backgroundColor: '#0a2f4d', duration: 3 }, 4)
        .to('.bg', { backgroundColor: '#01080f', duration: 3 }, 7);

      // 阳光消失 + 暗角加深
      tl.to('.rays', { opacity: 0, duration: 2 }, 0)
        .to('.vignette', { boxShadow: 'inset 0 0 220px 80px rbga(0,0,0,.85)', duration: 6 }, 3);

      // 深度 0 → 11000， onUpdate 把数字写进HUD（直接改DOM）
      tl.to(state, {
        depth: 11000,
        duration: 10,
        onUpdate: () => {
          if (depthRef.current) {
            depthRef.current.textContent = 
              Math.round(state.depth).toLocaleString() + ' m';
          }
          if (zoneRef.current) {
            zoneRef.current.textContent = getDepthZone(state.depth);
          }
        },
      }, 0);
    },
    { scope: sceneRef }
  );
}