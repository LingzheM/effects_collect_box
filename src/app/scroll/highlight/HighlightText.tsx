import { useEffect, useMemo, useRef } from "react";
import React from "react";

const FADED = 0.2;  // 未点亮时的透明度
const STAGGER = 0.1  // 字符之间的延迟
const START_RADIO = 0.80; // 元素顶部到达视口 80% 时， 进度 = 0
const END_RADIO = 0.50; // 元素中心到达视口 50% 时，进度 = 1

interface ScrollHighlightTextProps {
  text: string;
}

export default function ScrollHighlightText({ text } : ScrollHighlightTextProps) {

  const containerRef = useRef<HTMLHeadingElement>(null);
  const charRefs = useRef<HTMLSpanElement[]>([]);

  // 文本拆解预处理
  const { wordStructure, totalChars } = useMemo(() => {
    const words = text.trim().split(' ');
    let counter = 0;

    const structure = words.map((word) => ({
        word,
        chars: Array.from(word).map((char) => ({
          char,
          globalCharIndex: counter++,
        })),
      }));

    return { wordStructure: structure, totalChars: counter };
  }, [text]);

  useEffect(() => {
    const updateOpacity = () => {
      const el = containerRef.current;
      if (!el) return;

      // 计算进度
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;

      const startPx = vh * START_RADIO;
      const endPx = vh * END_RADIO - rect.height / 2;

      const raw = (rect.top - endPx) / (startPx - endPx);
      const progress = Math.max(0, Math.min(1, 1 - raw));

      // 直接改 style，不走 React
      const chars = charRefs.current;
      const n = chars.length;
      const total = 1 + (n - 1) * STAGGER;
      const playhead = progress * total;

      for (let i = 0; i < n; i++) {
        const local = Math.max(0, Math.min(1, playhead - i * STAGGER));
        const opacity = FADED + (1 - FADED) * local;
        chars[i].style.opacity = String(opacity);
      }
    };
  
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateOpacity();
        ticking = false;
      });
    };
    
    updateOpacity();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  
  return (
    <h2 className="highlight-container" ref={containerRef}>
      {wordStructure.map((wordObj, wordIndex) => (
        <React.Fragment key={`word-${wordIndex}`}>
          <span className="word">
            {wordObj.chars.map((item) => (
              <span
                key={item.globalCharIndex}
                ref={(el) => {
                  if (el) charRefs.current[item.globalCharIndex] = el;
                }}
                className="char"
                style={{ opacity: FADED }}
              >
                {item.char}
              </span>
            ))}
          </span>
          {/** 单词之间的空格 */}
          {wordIndex < wordStructure.length - 1 && <span className="space" />}
        </React.Fragment>
      ))}
    </h2>
  );
};
