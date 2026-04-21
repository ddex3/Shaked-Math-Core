import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ExpressionPanel.module.css';
import { useGraphStore } from '../../store/graphStore';
import { parse } from '../../engine/parser';
import type { Expression } from '../../types';
function SwirlIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 17 C 7 17, 8 7, 12 7 S 17 17, 20 7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14l-4-4 4-4" />
      <path d="M5 10h9a5 5 0 0 1 0 10h-3" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14l4-4-4-4" />
      <path d="M19 10h-9a5 5 0 0 0 0 10h3" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function ChevronsLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}
function ChevronsRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

interface RowProps {
  expr: Expression;
  index: number;
  error: string | null;
}

function Row({ expr, index, error }: RowProps) {
  const updateExpression = useGraphStore((s) => s.updateExpression);
  const removeExpression = useGraphStore((s) => s.removeExpression);
  const toggleVisible = useGraphStore((s) => s.toggleVisible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== expr.raw) {
      if (document.activeElement !== ref.current) {
        ref.current.textContent = expr.raw;
      }
    }
  }, [expr.raw]);

  return (
    <div className={styles.row}>
      <div className={styles.rowNumber}>{index + 1}</div>
      <div
        className={styles.iconBox}
        onClick={() => toggleVisible(expr.id)}
        title={expr.visible ? 'Hide' : 'Show'}
      >
        <div
          className={`${styles.iconInner} ${expr.visible ? '' : styles.iconInnerHidden}`}
          style={{ backgroundColor: expr.color }}
        >
          <SwirlIcon />
        </div>
      </div>
      <div className={styles.inputBox}>
        <div
          ref={ref}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={(e) => {
            const text = (e.currentTarget.textContent ?? '').replace(/\n/g, '');
            updateExpression(expr.id, text);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault();
          }}
        />
        {error && <div className={styles.error}>{error}</div>}
      </div>
      <button
        className={styles.closeBtn}
        onClick={() => removeExpression(expr.id)}
        title="Delete"
      >
        <XIcon />
      </button>
    </div>
  );
}

export function ExpressionPanel() {
  const expressions = useGraphStore((s) => s.expressions);
  const addExpression = useGraphStore((s) => s.addExpression);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  const canUndo = useGraphStore((s) => s.past.length > 0);
  const canRedo = useGraphStore((s) => s.future.length > 0);
  const showGrid = useGraphStore((s) => s.showGrid);
  const showAxes = useGraphStore((s) => s.showAxes);
  const setShowGrid = useGraphStore((s) => s.setShowGrid);
  const setShowAxes = useGraphStore((s) => s.setShowAxes);
  const resetViewport = useGraphStore((s) => s.resetViewport);
  const setPanelCollapsed = useGraphStore((s) => s.setPanelCollapsed);
  const panelCollapsed = useGraphStore((s) => s.panelCollapsed);
  const toggleVisible = useGraphStore((s) => s.toggleVisible);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        settingsWrapRef.current &&
        !settingsWrapRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [settingsOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const errors = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const e of expressions) {
      if (!e.raw.trim()) {
        map.set(e.id, null);
        continue;
      }
      const res = parse(e.raw);
      map.set(e.id, res.error);
    }
    return map;
  }, [expressions]);

  return (
    <div className={`${styles.panel} ${panelCollapsed ? styles.panelMini : ''}`}>
      {panelCollapsed ? (
        <div className={styles.miniContent}>
          <button
            className={styles.miniBtn}
            onClick={() => setPanelCollapsed(false)}
            title="Expand panel"
          >
            <ChevronsRightIcon className={styles.chevronMobile} />
          </button>
          <button
            className={styles.miniBtn}
            onClick={addExpression}
            title="Add expression"
          >
            <PlusIcon />
          </button>
          <div ref={settingsWrapRef} className={styles.miniSettingsWrap}>
            <button
              className={`${styles.miniBtn} ${settingsOpen ? styles.toolbarBtnActive : ''}`}
              onClick={() => setSettingsOpen((v) => !v)}
              title="Settings"
            >
              <GearIcon />
            </button>
            {settingsOpen && (
              <div className={`${styles.settingsPopover} ${styles.settingsPopoverMini}`}>
                <label className={styles.settingRow}>
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                  />
                  <span>Show grid</span>
                </label>
                <label className={styles.settingRow}>
                  <input
                    type="checkbox"
                    checked={showAxes}
                    onChange={(e) => setShowAxes(e.target.checked)}
                  />
                  <span>Show axes</span>
                </label>
                <div className={styles.settingDivider} />
                <button
                  className={styles.settingBtn}
                  onClick={() => {
                    resetViewport();
                    setSettingsOpen(false);
                  }}
                >
                  Reset view
                </button>
              </div>
            )}
          </div>
          <div className={styles.miniDivider} />
          <div className={styles.miniList}>
            {expressions.map((expr) => (
              <button
                key={expr.id}
                className={styles.miniIconBtn}
                onClick={() => toggleVisible(expr.id)}
                title={expr.raw || 'Expression'}
              >
                <div
                  className={`${styles.iconInner} ${expr.visible ? '' : styles.iconInnerHidden}`}
                  style={{ backgroundColor: expr.color }}
                >
                  <SwirlIcon />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.fullContent}>
          <div className={styles.toolbar}>
            <button className={styles.toolbarBtn} onClick={addExpression} title="Add expression">
              <PlusIcon />
            </button>
            <button
              className={styles.toolbarBtn}
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon />
            </button>
            <button
              className={styles.toolbarBtn}
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <RedoIcon />
            </button>
            <div className={styles.toolbarSpacer} />
            <div ref={settingsWrapRef} className={styles.settingsWrap}>
              <button
                className={`${styles.toolbarBtn} ${settingsOpen ? styles.toolbarBtnActive : ''}`}
                onClick={() => setSettingsOpen((v) => !v)}
                title="Settings"
              >
                <GearIcon />
              </button>
              {settingsOpen && (
                <div className={styles.settingsPopover}>
                  <label className={styles.settingRow}>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                    />
                    <span>Show grid</span>
                  </label>
                  <label className={styles.settingRow}>
                    <input
                      type="checkbox"
                      checked={showAxes}
                      onChange={(e) => setShowAxes(e.target.checked)}
                    />
                    <span>Show axes</span>
                  </label>
                  <div className={styles.settingDivider} />
                  <button
                    className={styles.settingBtn}
                    onClick={() => {
                      resetViewport();
                      setSettingsOpen(false);
                    }}
                  >
                    Reset view
                  </button>
                </div>
              )}
            </div>
            <button
              className={styles.toolbarBtn}
              onClick={() => setPanelCollapsed(true)}
              title="Collapse panel"
            >
              <ChevronsLeftIcon className={styles.chevronMobile} />
            </button>
          </div>
          <div className={styles.list}>
            {expressions.map((expr, i) => (
              <Row key={expr.id} expr={expr} index={i} error={errors.get(expr.id) ?? null} />
            ))}
            <div
              className={styles.emptyRow}
              onClick={addExpression}
              title="Add expression"
            >
              <div className={styles.rowNumber}>{expressions.length + 1}</div>
              <div className={styles.emptyPlaceholder} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
