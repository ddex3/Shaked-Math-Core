import styles from './MathKeyboard.module.css';

type Key =
  | { label: string; insert: string; wide?: boolean; fn?: boolean }
  | { label: string; action: 'backspace' | 'enter'; wide?: boolean; fn?: boolean };

const ROWS: Key[][] = [
  [
    { label: '7', insert: '7' },
    { label: '8', insert: '8' },
    { label: '9', insert: '9' },
    { label: '÷', insert: '/' },
    { label: 'sin', insert: 'sin(', fn: true },
    { label: 'cos', insert: 'cos(', fn: true },
  ],
  [
    { label: '4', insert: '4' },
    { label: '5', insert: '5' },
    { label: '6', insert: '6' },
    { label: '×', insert: '*' },
    { label: 'tan', insert: 'tan(', fn: true },
    { label: '√', insert: 'sqrt(', fn: true },
  ],
  [
    { label: '1', insert: '1' },
    { label: '2', insert: '2' },
    { label: '3', insert: '3' },
    { label: '−', insert: '-' },
    { label: 'log', insert: 'log(', fn: true },
    { label: 'ln', insert: 'ln(', fn: true },
  ],
  [
    { label: '0', insert: '0' },
    { label: '.', insert: '.' },
    { label: 'x', insert: 'x' },
    { label: '+', insert: '+' },
    { label: 'π', insert: 'pi' },
    { label: 'e', insert: 'e' },
  ],
  [
    { label: '(', insert: '(' },
    { label: ')', insert: ')' },
    { label: '^', insert: '^' },
    { label: ',', insert: ',' },
    { label: 'abs', insert: 'abs(', fn: true },
    { label: '⌫', action: 'backspace' },
  ],
];

function insertAtCaret(text: string) {
  const el = document.activeElement as HTMLElement | null;
  if (!el || !el.isContentEditable) return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    el.textContent = (el.textContent ?? '') + text;
  } else {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

function backspaceAtCaret() {
  const el = document.activeElement as HTMLElement | null;
  if (!el || !el.isContentEditable) return;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) {
    range.setStart(range.startContainer, Math.max(0, range.startOffset - 1));
  }
  range.deleteContents();
  el.dispatchEvent(new InputEvent('input', { bubbles: true }));
}

export function MathKeyboard() {
  const handle = (k: Key) => {
    if ('action' in k) {
      if (k.action === 'backspace') backspaceAtCaret();
    } else {
      insertAtCaret(k.insert);
    }
  };

  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, i) => (
        <div key={i} className={styles.row}>
          {row.map((k, j) => (
            <button
              key={j}
              className={`${styles.key} ${k.wide ? styles.keyWide : ''} ${k.fn ? styles.keyFn : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                e.preventDefault();
              }}
              onClick={() => handle(k)}
            >
              {k.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
