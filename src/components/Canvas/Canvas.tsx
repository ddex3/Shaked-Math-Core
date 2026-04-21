import { useEffect, useMemo, useRef } from 'react';
import styles from './Canvas.module.css';
import { useGraphStore } from '../../store/graphStore';
import { useResize } from '../../hooks/useResize';
import { useViewport } from '../../hooks/useViewport';
import { usePointer } from '../../hooks/usePointer';
import { parse } from '../../engine/parser';
import { compile } from '../../engine/evaluator';
import { sampleFunction, type SamplePoint } from '../../engine/sampler';
import type { Expression } from '../../types';
import { niceStep, formatTick } from '../../utils/mathUtils';
import { hexToRgba } from '../../utils/colorUtils';

interface CompiledExpression {
  expr: Expression;
  fn: ((x: number) => number) | null;
  inequalityOp?: '>' | '<' | '>=' | '<=';
  exprType: ReturnType<typeof parse>['exprType'];
}

function compileAll(expressions: Expression[]): CompiledExpression[] {
  return expressions.map((expr) => {
    if (!expr.raw.trim()) {
      return { expr, fn: null, exprType: 'unknown' as const };
    }
    const res = parse(expr.raw);
    if (res.error || !res.ast) {
      return { expr, fn: null, exprType: res.exprType };
    }
    const fn = compile(res.ast);
    return {
      expr,
      fn,
      inequalityOp: res.inequalityOp,
      exprType: res.exprType,
    };
  });
}

export function Canvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const expressions = useGraphStore((s) => s.expressions);
  const viewport = useGraphStore((s) => s.viewport);
  const showGrid = useGraphStore((s) => s.showGrid);
  const showAxes = useGraphStore((s) => s.showAxes);
  const setViewport = useGraphStore((s) => s.setViewport);

  const size = useResize(wrapperRef);

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return;
    const { xMin, xMax, yMin, yMax } = viewport;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    if (xRange <= 0 || yRange <= 0) return;
    const targetYRange = xRange * (size.height / size.width);
    if (Math.abs(targetYRange - yRange) / yRange < 0.001) return;
    const cy = (yMin + yMax) / 2;
    setViewport({
      xMin,
      xMax,
      yMin: cy - targetYRange / 2,
      yMax: cy + targetYRange / 2,
    });
  }, [size.width, size.height, viewport, setViewport]);

  const transform = useViewport(viewport, size.width, size.height);

  usePointer({ ref: wrapperRef, transform });

  const compiled = useMemo(() => compileAll(expressions), [expressions]);

  const sampleCache = useRef<Map<string, { key: string; samples: SamplePoint[] }>>(
    new Map()
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (size.width <= 0 || size.height <= 0) return;

    const dpr = size.dpr;
    const pxW = Math.max(1, Math.floor(size.width * dpr));
    const pxH = Math.max(1, Math.floor(size.height * dpr));
    if (canvas.width !== pxW) canvas.width = pxW;
    if (canvas.height !== pxH) canvas.height = pxH;
    canvas.style.width = size.width + 'px';
    canvas.style.height = size.height + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size.width, size.height);

      const { xMin, xMax, yMin, yMax } = viewport;

      if (showGrid) {
        const xStep = niceStep(xMax - xMin, 10);
        const yStep = niceStep(yMax - yMin, 8);
        const xMinor = xStep / 5;
        const yMinor = yStep / 5;

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#f0f0f0';
        ctx.beginPath();
        const firstXMinor = Math.ceil(xMin / xMinor) * xMinor;
        for (let x = firstXMinor; x <= xMax; x += xMinor) {
          const px = transform.mathToPixelX(x);
          ctx.moveTo(px, 0);
          ctx.lineTo(px, size.height);
        }
        const firstYMinor = Math.ceil(yMin / yMinor) * yMinor;
        for (let y = firstYMinor; y <= yMax; y += yMinor) {
          const py = transform.mathToPixelY(y);
          ctx.moveTo(0, py);
          ctx.lineTo(size.width, py);
        }
        ctx.stroke();

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#d8d8d8';
        ctx.beginPath();
        const firstX = Math.ceil(xMin / xStep) * xStep;
        for (let x = firstX; x <= xMax; x += xStep) {
          const px = transform.mathToPixelX(x);
          ctx.moveTo(px, 0);
          ctx.lineTo(px, size.height);
        }
        const firstY = Math.ceil(yMin / yStep) * yStep;
        for (let y = firstY; y <= yMax; y += yStep) {
          const py = transform.mathToPixelY(y);
          ctx.moveTo(0, py);
          ctx.lineTo(size.width, py);
        }
        ctx.stroke();
      }

      if (showAxes) {
        const xStep = niceStep(xMax - xMin, 10);
        const yStep = niceStep(yMax - yMin, 8);

        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const y0 = transform.mathToPixelY(0);
        if (y0 >= 0 && y0 <= size.height) {
          ctx.moveTo(0, y0);
          ctx.lineTo(size.width, y0);
        }
        const x0 = transform.mathToPixelX(0);
        if (x0 >= 0 && x0 <= size.width) {
          ctx.moveTo(x0, 0);
          ctx.lineTo(x0, size.height);
        }
        ctx.stroke();

        ctx.fillStyle = '#555';
        ctx.font = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const yAxisY = Math.min(Math.max(y0, 0), size.height - 14);
        const firstX = Math.ceil(xMin / xStep) * xStep;
        for (let x = firstX; x <= xMax; x += xStep) {
          if (Math.abs(x) < xStep / 1000) continue;
          const px = transform.mathToPixelX(x);
          ctx.fillText(formatTick(x, xStep), px, yAxisY + 2);
          ctx.beginPath();
          ctx.moveTo(px, yAxisY - 3);
          ctx.lineTo(px, yAxisY + 3);
          ctx.strokeStyle = '#555';
          ctx.stroke();
        }
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        const xAxisX = Math.min(Math.max(x0, 16), size.width - 4);
        const firstY = Math.ceil(yMin / yStep) * yStep;
        for (let y = firstY; y <= yMax; y += yStep) {
          if (Math.abs(y) < yStep / 1000) continue;
          const py = transform.mathToPixelY(y);
          ctx.fillText(formatTick(y, yStep), xAxisX - 4, py);
          ctx.beginPath();
          ctx.moveTo(xAxisX - 3, py);
          ctx.lineTo(xAxisX + 3, py);
          ctx.strokeStyle = '#555';
          ctx.stroke();
        }
        if (
          x0 >= 0 && x0 <= size.width &&
          y0 >= 0 && y0 <= size.height
        ) {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('0', x0 - 4, y0 + 2);
        }
      }

      for (const c of compiled) {
        if (!c.expr.visible || !c.fn) continue;
        if (c.exprType !== 'function' && c.exprType !== 'inequality') continue;

        const cacheKey = `${c.expr.raw}|${xMin}|${xMax}|${yMin}|${yMax}`;
        let samples: SamplePoint[];
        const cached = sampleCache.current.get(c.expr.id);
        if (cached && cached.key === cacheKey) {
          samples = cached.samples;
        } else {
          samples = sampleFunction(c.fn, xMin, xMax, yMin, yMax, 800);
          sampleCache.current.set(c.expr.id, { key: cacheKey, samples });
        }

        if (c.exprType === 'inequality' && c.inequalityOp) {
          const above = c.inequalityOp === '>' || c.inequalityOp === '>=';
          ctx.fillStyle = hexToRgba(c.expr.color, 0.2);
          ctx.beginPath();
          let penDown = false;
          for (const s of samples) {
            if (!s.valid) {
              if (penDown) {
                const edgeY = above ? 0 : size.height;
                const lastX = transform.mathToPixelX(s.x);
                ctx.lineTo(lastX, edgeY);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                penDown = false;
              }
              continue;
            }
            const px = transform.mathToPixelX(s.x);
            const py = transform.mathToPixelY(s.y);
            if (!penDown) {
              const edgeY = above ? 0 : size.height;
              ctx.moveTo(px, edgeY);
              ctx.lineTo(px, py);
              penDown = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
          if (penDown) {
            const edgeY = above ? 0 : size.height;
            const lastSample = samples[samples.length - 1];
            const lastX = transform.mathToPixelX(lastSample.x);
            ctx.lineTo(lastX, edgeY);
            ctx.closePath();
            ctx.fill();
          }
        }

        ctx.strokeStyle = c.expr.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        let penDown = false;
        for (const s of samples) {
          if (!s.valid) {
            penDown = false;
            continue;
          }
          const px = transform.mathToPixelX(s.x);
          const py = transform.mathToPixelY(s.y);
          if (!penDown) {
            ctx.moveTo(px, py);
            penDown = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [viewport, compiled, showGrid, showAxes, size, transform]);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
