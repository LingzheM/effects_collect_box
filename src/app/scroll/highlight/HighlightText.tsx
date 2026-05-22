import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import React from "react";

const FADED = 0.2;  // 未点亮时的透明度
const STAGGER = 0.1  // 字符之间的延迟
const START_RADIO = 0.80; // 元素顶部到达视口 80% 时， 进度 = 0
const END_RADIO = 0.50; // 元素中心到达视口 50% 时，进度 = 1

interface ScrollHighlightTextProps {
  text: string;
}

export default function ScrollHighlightText({
  text,
} : ScrollHighlightTextProps) {

  const containerRef = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState<number>(0);

  // 文本拆解预处理
  const { wordStructure, totalChars } = useMemo(() => {
    const words = text.trim().split(' ');
    let globalCharIndex = 0;

    const structure = words.map((word) => {
      return {
        word,
        chars: word.split('').map((char) => ({
          char,
          globalCharIndex: globalCharIndex++,
        })),
      };
    });

    return { wordStructure: structure, totalChars: globalCharIndex };
  }, [text]);

  // 2. 计算当前滚动进度
  const calculateProgress = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const vh = window.innerHeight;

    const startPx = vh * START_RADIO;
    const endPx = vh * END_RADIO - rect.height / 2;

    const raw = (rect.top - endPx) / (startPx - endPx);
    const clampedProgress = Math.max(0, Math.min(1, 1 - raw));

    setProgress(clampedProgress);
  }, []);

  // 3. 绑定滚动事件（带 raf 节流）
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        calculateProgress();
      });
      ticking = false;
    };

    // 初始化执行一次，防止元素已经在视口中但没计算
    calculateProgress();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [calculateProgress]);

  // 4. 渲染辅助：计算单个字符的透明度
  const getCharOpacity = (charIndex: number): number => {
    // 总时长 = 1（单字动画） + （总字数-1）*延迟
    const totalDuration = 1 + (totalChars - 1) * STAGGER;
    const playhead = progress * totalDuration;

    const charStart = charIndex * STAGGER;
    const localProgress = Math.max(0, Math.min(1, playhead - charStart));
    return FADED + (1 - FADED) * localProgress;
  }
  
  return (
    <h2 className={`highlight-container`} ref={containerRef}>
      {wordStructure.map((wordObj, wordIndex) => (
        <React.Fragment key={`word-${wordIndex}`}>
          <span className="word">
            {wordObj.chars.map((item) => (
              <span
                key={`char-${item.globalCharIndex}`}
                className="char"
                style={{ opacity: getCharOpacity(item.globalCharIndex) }}
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
