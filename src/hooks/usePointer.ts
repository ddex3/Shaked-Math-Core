import { useEffect, useRef, type RefObject } from 'react';
import { useGraphStore } from '../store/graphStore';
import type { ViewportTransform } from './useViewport';

interface Options {
  ref: RefObject<HTMLElement | null>;
  transform: ViewportTransform;
}

export function usePointer({ ref, transform }: Options) {
  const panViewport = useGraphStore((s) => s.panViewport);
  const zoomViewport = useGraphStore((s) => s.zoomViewport);

  const transformRef = useRef(transform);
  transformRef.current = transform;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    let touchMode: 'none' | 'pan' | 'pinch' = 'none';
    let lastTouchX = 0;
    let lastTouchY = 0;
    let lastPinchDist = 0;
    let lastPinchCenter: [number, number] = [0, 0];

    const getLocal = (clientX: number, clientY: number): [number, number] => {
      const rect = el.getBoundingClientRect();
      return [clientX - rect.left, clientY - rect.top];
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dxPx = e.clientX - lastX;
      const dyPx = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const t = transformRef.current;
      const { viewport, width, height } = t;
      if (width <= 0 || height <= 0) return;
      const dxMath = (dxPx / width) * (viewport.xMax - viewport.xMin);
      const dyMath = -(dyPx / height) * (viewport.yMax - viewport.yMin);
      panViewport(dxMath, dyMath);
    };

    const onMouseUp = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      const [px, py] = getLocal(e.clientX, e.clientY);
      const [cx, cy] = t.pixelToMath(px, py);
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoomViewport(factor, cx, cy);
    };

    const pinchDist = (a: Touch, b: Touch) =>
      Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchMode = 'pan';
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        touchMode = 'pinch';
        lastPinchDist = pinchDist(e.touches[0], e.touches[1]);
        const [px, py] = getLocal(
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2
        );
        lastPinchCenter = transformRef.current.pixelToMath(px, py);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = transformRef.current;
      if (touchMode === 'pan' && e.touches.length === 1) {
        const dxPx = e.touches[0].clientX - lastTouchX;
        const dyPx = e.touches[0].clientY - lastTouchY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        const { viewport, width, height } = t;
        if (width <= 0 || height <= 0) return;
        const dxMath = (dxPx / width) * (viewport.xMax - viewport.xMin);
        const dyMath = -(dyPx / height) * (viewport.yMax - viewport.yMin);
        panViewport(dxMath, dyMath);
      } else if (touchMode === 'pinch' && e.touches.length === 2) {
        const d = pinchDist(e.touches[0], e.touches[1]);
        if (lastPinchDist > 0) {
          const factor = d / lastPinchDist;
          zoomViewport(factor, lastPinchCenter[0], lastPinchCenter[1]);
        }
        lastPinchDist = d;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) touchMode = 'none';
      else if (e.touches.length === 1) {
        touchMode = 'pan';
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };

    el.style.cursor = 'grab';
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, panViewport, zoomViewport]);
}
