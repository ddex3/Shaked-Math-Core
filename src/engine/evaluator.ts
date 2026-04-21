import type { ASTNode } from './parser';

const FN_MAP: Record<string, (...args: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  log: Math.log10,
  ln: Math.log,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
};

export function evaluate(node: ASTNode, vars: Record<string, number>): number {
  switch (node.type) {
    case 'number':
      return node.value;
    case 'variable': {
      const v = vars[node.name];
      return v === undefined ? NaN : v;
    }
    case 'unary': {
      const v = evaluate(node.operand, vars);
      return node.op === '-' ? -v : v;
    }
    case 'binop': {
      const l = evaluate(node.left, vars);
      const r = evaluate(node.right, vars);
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r === 0 ? NaN : l / r;
        case '^': return Math.pow(l, r);
        default: return NaN;
      }
    }
    case 'call': {
      const fn = FN_MAP[node.fn];
      if (!fn) return NaN;
      const args = node.args.map((a) => evaluate(a, vars));
      return fn(...args);
    }
  }
}

export function compile(node: ASTNode): (x: number) => number {
  return (x: number) => evaluate(node, { x });
}
