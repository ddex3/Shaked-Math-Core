import styles from './Toolbar.module.css';
import { useGraphStore } from '../../store/graphStore';

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconMinus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  );
}

export function Toolbar() {
  const viewport = useGraphStore((s) => s.viewport);
  const zoomViewport = useGraphStore((s) => s.zoomViewport);
  const resetViewport = useGraphStore((s) => s.resetViewport);
  const showGrid = useGraphStore((s) => s.showGrid);
  const setShowGrid = useGraphStore((s) => s.setShowGrid);

  const zoomAtCenter = (factor: number) => {
    const cx = (viewport.xMin + viewport.xMax) / 2;
    const cy = (viewport.yMin + viewport.yMax) / 2;
    zoomViewport(factor, cx, cy);
  };

  return (
    <div className={styles.bar}>
      <button className={styles.btn} onClick={() => zoomAtCenter(1.4)} title="Zoom in">
        <IconPlus />
      </button>
      <button className={styles.btn} onClick={() => zoomAtCenter(1 / 1.4)} title="Zoom out">
        <IconMinus />
      </button>
      <button className={styles.btn} onClick={resetViewport} title="Reset view">
        <IconHome />
      </button>
      <button
        className={`${styles.btn} ${showGrid ? styles.btnActive : ''}`}
        onClick={() => setShowGrid(!showGrid)}
        title="Toggle grid"
      >
        <IconGrid />
      </button>
    </div>
  );
}
