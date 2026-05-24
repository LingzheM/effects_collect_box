import { ReactNode } from "react";

interface FlapProps {
  side: 'left' | 'right';
  children?: ReactNode;
}

export function Flap({ side, children }: FlapProps) {
  return (
    <div className={`flap flap--${side}`}>
      <div className="face face--font">
        {children}
        <div className="snap-node" />
      </div>
      <div className="face face--back" />
    </div>
  )
}