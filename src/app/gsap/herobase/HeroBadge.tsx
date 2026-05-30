import { ReactNode, useRef } from "react";
import styles from './HeroBase.module.css';
import { useGSAP } from '@gsap/react';
import { gsap } from "gsap/gsap-core";

interface HeroBadgeProps {
  children?: ReactNode;
  /** 登场动画时长 */
  entranceDuration?: number;
}

export function HeroBadge({
  children = '⚡',
  entranceDuration = 1.5,
}: HeroBadgeProps) {

  const badgeRef = useRef<HTMLDivElement>(null);

  // 登场动画：from = 从“异常状态”回到css写的“正常状态”
  useGSAP(
    () => {
      gsap.from(badgeRef.current, {
        y: -400,  //从上方 400px 处掉下来
        rotation: 720, // 旋转两圈
        scale: 0, // 从0放大
        duration: entranceDuration,
        ease: 'bounce.out', // 落地弹跳
      });
    },
    { dependencies: [entranceDuration] }
  );

  // 点击反馈：to = 从当前运动到目标态（这里做一个“按下”效果）
  const handleClick = () => {
    gsap.to(badgeRef.current, {
      scale: 0.85,
      duration: 0.1,
      yoyo: true,
      repeat: 1,  // 缩小再弹回 = 一次“按压”反馈
    });
  };

  return (
    <div ref={badgeRef} className={styles.badge} onClick={handleClick}>
      {children}
    </div>
  )
}