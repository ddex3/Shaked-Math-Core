import { useMemo } from 'react';
import type { Viewport } from '../types';

export interface ViewportTransform {
  mathToPixel: (mx: number, my: number) => [number, number];
  pixelToMath: (px: number, py: number) => [number, number];
  mathToPixelX: (mx: number) => number;
  mathToPixelY: (my: number) => number;
  pixelToMathX: (px: number) => number;
  pixelToMathY: (py: number) => number;
  width: number;
  height: number;
  viewport: Viewport;
}

export function useViewport(
  viewport: Viewport,
  width: number,
  height: number
): ViewportTransform {
  return useMemo(() => {
    const { xMin, xMax, yMin, yMax } = viewport;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const mathToPixelX = (mx: number) => ((mx - xMin) / xRange) * width;
    const mathToPixelY = (my: number) => ((yMax - my) / yRange) * height;
    const pixelToMathX = (px: number) => xMin + (px / width) * xRange;
    const pixelToMathY = (py: number) => yMax - (py / height) * yRange;

    const mathToPixel = (mx: number, my: number): [number, number] => [
      mathToPixelX(mx),
      mathToPixelY(my),
    ];
    const pixelToMath = (px: number, py: number): [number, number] => [
      pixelToMathX(px),
      pixelToMathY(py),
    ];

    return {
      mathToPixel,
      pixelToMath,
      mathToPixelX,
      mathToPixelY,
      pixelToMathX,
      pixelToMathY,
      width,
      height,
      viewport,
    };
  }, [viewport, width, height]);
}
