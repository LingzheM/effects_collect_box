import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';
import { getDepthZone } from './creatures';

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
  zoneRef,
}: UseDiveTimelineOptions) {
  useGSAP(
    () => {
      // depth 是个普通对象,被 GSAP 当"可补间的数值容器"用
      const state = { depth: 0 };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sceneRef.current,
          start: 'top top',     // 场景顶碰到视口顶时开始
          end: '+=3000',        // 再滚 3000px 结束
          scrub: 1,             // 进度绑死滚动(1 = 平滑跟随)
          pin: true,            // 钉住场景,页面"穿过"它
        },
      });

      // 背景变深
      tl.to('.bg', { backgroundColor: '#2f86b8', duration: 2 }, 0)
        .to('.bg', { backgroundColor: '#16527e', duration: 2 }, 2)
        .to('.bg', { backgroundColor: '#0a2f4d', duration: 3 }, 4)
        .to('.bg', { backgroundColor: '#01080f', duration: 3 }, 7);

      // 阳光消失 + 暗角加深
      tl.to('.rays', { opacity: 0, duration: 2 }, 0)
        .to('.vignette',
          { boxShadow: 'inset 0 0 220px 80px rgba(0,0,0,.85)', duration: 6 }, 3);

      // 深度 0 → 11000,onUpdate 把数字写进 HUD(直接改 DOM)
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

      // 生物们在各自深度区间淡入漂移淡出
      tl.to('#tropical', { x: 140, duration: 3 }, 0)
        .to(['#tropical', '#tropical2'], { opacity: 0, y: -40, duration: 1.5 }, 1.3)
        .fromTo('#jelly', { opacity: 0 }, { opacity: 0.95, duration: 1 }, 2.4)
        .to('#jelly', { y: -300, duration: 5 }, 2.4)
        .to('#jelly', { opacity: 0, duration: 1 }, 5.4)
        .fromTo('#jelly2', { opacity: 0 }, { opacity: 0.9, duration: 1 }, 3.2)
        .to('#jelly2', { y: -360, duration: 5 }, 3.2)
        .to('#jelly2', { opacity: 0, duration: 1 }, 5.8)
        .fromTo('#squid', { opacity: 0, x: 60 }, { opacity: 0.95, x: -50, duration: 2 }, 5)
        .to('#squid', { opacity: 0, duration: 1 }, 7)
        .fromTo('#angler', { opacity: 0 }, { opacity: 1, duration: 1.5 }, 7.2);
    },
    { scope: sceneRef }   // 限定选择器在场景内,且自动清理(含 ScrollTrigger)
  );
}