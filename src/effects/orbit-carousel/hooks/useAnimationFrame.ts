"use client";
import { useEffect, useRef } from "react";

export function useAnimationFrame (
  callback: (dt: number) => void,
  active: boolean
) {
  // 用 ref 持有最新的 callback，这样改 callback 不会触发 effect 重启
  const callbackRef = useRef(callback);
  callback.current = callback;

  useEffect(() => {
    if (!active) return;

    let rafId: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      callbackRef.current(dt);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active]);
}