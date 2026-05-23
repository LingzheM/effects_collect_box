import { forwardRef } from "react";
import { CardData } from "./cards";

/**
 * 用 forwardRef 把外层传进来的 ref 转给真实的 <div>
 * 这样父组件就能用 gsap.set(domNode, {...}) 直接驱动它。

 * 没有 forwardRef 的话, ref 会被 React 当成普通 prop 丢掉。
 */
export const MotionPathCard = forwardRef<HTMLDivElement, CardData>(
  ({ emoji, title, description }, ref) => (
    <div className="card" ref={ref}>
      <div className="card-emoji">{emoji}</div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{description}</div>
    </div>
  )
)

MotionPathCard.displayName = "MotionPathCard";