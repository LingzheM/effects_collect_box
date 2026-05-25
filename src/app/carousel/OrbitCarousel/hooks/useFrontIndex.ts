import { useMemo } from "react";

export function useFrontIndex(angle: number, count: number): number {
  return useMemo(() => {
    const step = 360 / count;
    let best = 0;
    let bestDiff = Infinity;

    for (let i = 0; i < count; i++) {
      const itemAngle = i * step;
      let diff = ((itemAngle + angle) % 360 + 360) % 360;
      if (diff > 180) diff = 360 - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    return best;
  }, [angle, count]);
}