import { create } from 'zustand';
import type { Expression, Viewport } from '../types';
import { COLORS, nextColor } from '../utils/colorUtils';
import { uniqueId } from '../utils/mathUtils';

const DEFAULT_VIEWPORT: Viewport = { xMin: -10, xMax: 10, yMin: -7, yMax: 7 };
const HISTORY_LIMIT = 100;

interface GraphState {
  expressions: Expression[];
  viewport: Viewport;
  showGrid: boolean;
  showAxes: boolean;
  panelCollapsed: boolean;

  past: Expression[][];
  future: Expression[][];

  addExpression: () => void;
  updateExpression: (id: string, raw: string) => void;
  removeExpression: (id: string) => void;
  toggleVisible: (id: string) => void;
  setViewport: (vp: Viewport) => void;
  panViewport: (dx: number, dy: number) => void;
  zoomViewport: (factor: number, centerX: number, centerY: number) => void;
  resetViewport: () => void;
  setShowGrid: (v: boolean) => void;
  setShowAxes: (v: boolean) => void;
  setPanelCollapsed: (v: boolean) => void;
  undo: () => void;
  redo: () => void;
  hydrate: (expressions: Expression[]) => void;
}

function pushHistory(past: Expression[][], snapshot: Expression[]): Expression[][] {
  const next = past.length >= HISTORY_LIMIT ? past.slice(1) : past.slice();
  next.push(snapshot);
  return next;
}

export const useGraphStore = create<GraphState>((set) => ({
  expressions: [],
  viewport: { ...DEFAULT_VIEWPORT },
  showGrid: true,
  showAxes: true,
  panelCollapsed: false,
  past: [],
  future: [],

  addExpression: () =>
    set((state) => {
      const used = new Set(state.expressions.map((e) => e.color));
      let color: string | undefined;
      for (const c of COLORS) {
        if (!used.has(c)) {
          color = c;
          break;
        }
      }
      if (!color) color = nextColor(state.expressions.length);
      const expr: Expression = {
        id: uniqueId(),
        raw: '',
        color,
        visible: true,
        type: 'unknown',
        error: null,
      };
      return {
        expressions: [...state.expressions, expr],
        past: pushHistory(state.past, state.expressions),
        future: [],
      };
    }),

  updateExpression: (id, raw) =>
    set((state) => ({
      expressions: state.expressions.map((e) =>
        e.id === id ? { ...e, raw } : e
      ),
      past: pushHistory(state.past, state.expressions),
      future: [],
    })),

  removeExpression: (id) =>
    set((state) => ({
      expressions: state.expressions.filter((e) => e.id !== id),
      past: pushHistory(state.past, state.expressions),
      future: [],
    })),

  toggleVisible: (id) =>
    set((state) => ({
      expressions: state.expressions.map((e) =>
        e.id === id ? { ...e, visible: !e.visible } : e
      ),
      past: pushHistory(state.past, state.expressions),
      future: [],
    })),

  setViewport: (viewport) => set({ viewport }),

  panViewport: (dx, dy) =>
    set((state) => ({
      viewport: {
        xMin: state.viewport.xMin - dx,
        xMax: state.viewport.xMax - dx,
        yMin: state.viewport.yMin - dy,
        yMax: state.viewport.yMax - dy,
      },
    })),

  zoomViewport: (factor, cx, cy) =>
    set((state) => {
      const { xMin, xMax, yMin, yMax } = state.viewport;
      return {
        viewport: {
          xMin: cx - (cx - xMin) / factor,
          xMax: cx + (xMax - cx) / factor,
          yMin: cy - (cy - yMin) / factor,
          yMax: cy + (yMax - cy) / factor,
        },
      };
    }),

  resetViewport: () => set({ viewport: { ...DEFAULT_VIEWPORT } }),

  setShowGrid: (v) => set({ showGrid: v }),
  setShowAxes: (v) => set({ showAxes: v }),
  setPanelCollapsed: (v) => set({ panelCollapsed: v }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      const newFuture = [...state.future, state.expressions];
      return { expressions: previous, past: newPast, future: newFuture };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};
      const next = state.future[state.future.length - 1];
      const newFuture = state.future.slice(0, -1);
      const newPast = pushHistory(state.past, state.expressions);
      return { expressions: next, past: newPast, future: newFuture };
    }),

  hydrate: (expressions) => set({ expressions, past: [], future: [] }),
}));
