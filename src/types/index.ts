export type ExpressionType =
  | 'function'
  | 'inequality'
  | 'parametric'
  | 'implicit'
  | 'point'
  | 'unknown';

export interface Expression {
  id: string;
  raw: string;
  color: string;
  visible: boolean;
  type: ExpressionType;
  error: string | null;
}

export interface Viewport {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface Point {
  x: number;
  y: number;
}
