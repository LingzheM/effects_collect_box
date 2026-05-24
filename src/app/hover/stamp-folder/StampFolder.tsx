"use client";

import { useState } from "react"
import { defaultStamps, StampData } from "./stamps";
import { Flap } from "./Flap";
import './StampFolder.css';

interface StampFolderProps {
  stamps? : StampData[];
  hint?: string;
}

export function StampFolder({
  stamps = defaultStamps,
  hint = 'HOVER 展开卡包  |  CLICK 抽出查看  |  再次 HOVER 拨开邮票',
}: StampFolderProps) {

  const [isActive, setIsActive] = useState(false);

  const totalLabel = `${stamps.length.toString().padStart(2, '0')} total`;

  return (
    <>
      <div 
        className={`scene ${isActive ? 'is-active' : ''}`}
        onClick={() => setIsActive((prev) => !prev)}
      >
        <div className="folder">
          <Flap side="left">
            <div className="logo">*</div>
            <div className="cover-title">Stamp collection
              <span className="cover-title__sub">{totalLabel}</span>
            </div>
          </Flap>
          <Flap side="right" />

          <div className="pocket-base" />

          <div className="stamps-wrapper">
              
          </div>

          <div className="pocket-front" />
        </div>
      </div>

      {hint && <div className="hint">{hint}</div>}
    </>
  )
}