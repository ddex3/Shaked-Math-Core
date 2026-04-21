import { useEffect, useRef } from 'react';
import { ExpressionPanel } from './components/ExpressionPanel/ExpressionPanel';
import { Canvas } from './components/Canvas/Canvas';
import { Toolbar } from './components/Toolbar/Toolbar';
import { useGraphStore } from './store/graphStore';
import type { Expression } from './types';
import { COLORS } from './utils/colorUtils';
import { uniqueId } from './utils/mathUtils';

function loadFromHash(): Expression[] | null {
  if (!window.location.hash) return null;
  try {
    const raw = window.location.hash.slice(1);
    const json = atob(decodeURIComponent(raw));
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    const out: Expression[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as Expression).raw === 'string'
      ) {
        const it = item as Partial<Expression>;
        out.push({
          id: it.id ?? uniqueId(),
          raw: it.raw ?? '',
          color: it.color ?? COLORS[0],
          visible: it.visible ?? true,
          type: it.type ?? 'unknown',
          error: it.error ?? null,
        });
      }
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

function writeHash(expressions: Expression[]) {
  const minimal = expressions.map((e) => ({
    id: e.id,
    raw: e.raw,
    color: e.color,
    visible: e.visible,
  }));
  try {
    const encoded = btoa(JSON.stringify(minimal));
    const target = '#' + encoded;
    if (window.location.hash !== target) {
      history.replaceState(null, '', target);
    }
  } catch {
  }
}

function App() {
  const expressions = useGraphStore((s) => s.expressions);
  const hydrate = useGraphStore((s) => s.hydrate);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fromHash = loadFromHash();
    if (fromHash) {
      hydrate(fromHash);
    } else {
      hydrate([
        {
          id: uniqueId(),
          raw: 'y = sin(x)',
          color: COLORS[0],
          visible: true,
          type: 'function',
          error: null,
        },
        {
          id: uniqueId(),
          raw: 'y = x^2 / 4',
          color: COLORS[1],
          visible: true,
          type: 'function',
          error: null,
        },
      ]);
    }
  }, [hydrate]);

  useEffect(() => {
    if (!initialized.current) return;
    const handle = window.setTimeout(() => writeHash(expressions), 500);
    return () => window.clearTimeout(handle);
  }, [expressions]);

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-screen overflow-hidden bg-white">
      <ExpressionPanel />
      <div className="relative flex-1 min-w-0 min-h-0">
        <Canvas />
        <Toolbar />
      </div>
    </div>
  );
}

export default App;
