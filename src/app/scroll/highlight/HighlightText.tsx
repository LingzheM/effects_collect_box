import { useMemo, useRef, useState } from "react";
import React from "react";

const FADED = 0.2;  //未点亮时的透明度
const STAGGER = 0.1  // 字符之间的延迟

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
                style={{ opacity: getCharOpacity(item.globalIndex) }}
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
