export const COLORS = [
  '#C0413E',
  '#2D70B3',
  '#388c46',
  '#fa7e19',
  '#6042a6',
  '#000000',
] as const;

export function nextColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
