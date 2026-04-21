import type { ExpressionType } from '../types';

export type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; name: string }
  | { type: 'binop'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: string; operand: ASTNode }
  | { type: 'call'; fn: string; args: ASTNode[] };

export type InequalityOp = '>' | '<' | '>=' | '<=';

export interface ParseResult {
  ast: ASTNode | null;
  exprType: ExpressionType;
  inequalityOp?: InequalityOp;
  error: string | null;
}

const FUNCTIONS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'sqrt', 'abs', 'log', 'ln', 'exp', 'floor', 'ceil',
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

type Tok =
  | { t: 'num'; v: number }
  | { t: 'ident'; v: string }
  | { t: 'op'; v: '+' | '-' | '*' | '/' | '^' }
  | { t: 'lparen' }
  | { t: 'rparen' }
  | { t: 'comma' }
  | { t: 'eq' }
  | { t: 'cmp'; v: InequalityOp }
  | { t: 'eof' };

function tokenize(src: string): Tok[] | string {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (c >= '0' && c <= '9' || c === '.') {
      let j = i;
      while (j < src.length && ((src[j] >= '0' && src[j] <= '9') || src[j] === '.')) j++;
      const text = src.slice(i, j);
      const v = parseFloat(text);
      if (!isFinite(v)) return `Invalid number: ${text}`;
      toks.push({ t: 'num', v });
      i = j;
      continue;
    }
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_') {
      let j = i;
      while (
        j < src.length &&
        ((src[j] >= 'a' && src[j] <= 'z') ||
          (src[j] >= 'A' && src[j] <= 'Z') ||
          (src[j] >= '0' && src[j] <= '9') ||
          src[j] === '_')
      ) j++;
      toks.push({ t: 'ident', v: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/' || c === '^') {
      toks.push({ t: 'op', v: c as '+' | '-' | '*' | '/' | '^' });
      i++;
      continue;
    }
    if (c === '(') { toks.push({ t: 'lparen' }); i++; continue; }
    if (c === ')') { toks.push({ t: 'rparen' }); i++; continue; }
    if (c === ',') { toks.push({ t: 'comma' }); i++; continue; }
    if (c === '>' || c === '<') {
      if (src[i + 1] === '=') {
        toks.push({ t: 'cmp', v: (c + '=') as InequalityOp });
        i += 2;
      } else {
        toks.push({ t: 'cmp', v: c as InequalityOp });
        i++;
      }
      continue;
    }
    if (c === '=') { toks.push({ t: 'eq' }); i++; continue; }
    return `Unexpected character: "${c}"`;
  }
  toks.push({ t: 'eof' });
  return toks;
}

class Parser {
  private pos = 0;
  constructor(private toks: Tok[]) {}

  private peek(offset = 0): Tok {
    return this.toks[this.pos + offset] ?? { t: 'eof' };
  }
  private consume(): Tok {
    return this.toks[this.pos++];
  }
  private expect(t: Tok['t']): Tok {
    const tok = this.peek();
    if (tok.t !== t) throw new Error(`Expected ${t}, got ${tok.t}`);
    return this.consume();
  }

  parseExpr(): ASTNode {
    return this.parseAdd();
  }

  private parseAdd(): ASTNode {
    let left = this.parseMul();
    while (true) {
      const tok = this.peek();
      if (tok.t === 'op' && (tok.v === '+' || tok.v === '-')) {
        this.consume();
        const right = this.parseMul();
        left = { type: 'binop', op: tok.v, left, right };
      } else {
        break;
      }
    }
    return left;
  }

  private parseMul(): ASTNode {
    let left = this.parseUnary();
    while (true) {
      const tok = this.peek();
      if (tok.t === 'op' && (tok.v === '*' || tok.v === '/')) {
        this.consume();
        const right = this.parseUnary();
        left = { type: 'binop', op: tok.v, left, right };
        continue;
      }
      if (this.isImplicitMulBoundary(left)) {
        const right = this.parseUnary();
        left = { type: 'binop', op: '*', left, right };
        continue;
      }
      break;
    }
    return left;
  }

  private isImplicitMulBoundary(_left: ASTNode): boolean {
    const next = this.peek();
    if (next.t === 'num') return true;
    if (next.t === 'lparen') return true;
    if (next.t === 'ident') {
      return true;
    }
    return false;
  }

  private parseUnary(): ASTNode {
    const tok = this.peek();
    if (tok.t === 'op' && tok.v === '-') {
      this.consume();
      const operand = this.parseUnary();
      return { type: 'unary', op: '-', operand };
    }
    if (tok.t === 'op' && tok.v === '+') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePower();
  }

  private parsePower(): ASTNode {
    const left = this.parsePrimary();
    const tok = this.peek();
    if (tok.t === 'op' && tok.v === '^') {
      this.consume();
      const right = this.parseUnary();
      return { type: 'binop', op: '^', left, right };
    }
    return left;
  }

  private parsePrimary(): ASTNode {
    const tok = this.peek();
    if (tok.t === 'num') {
      this.consume();
      return { type: 'number', value: tok.v };
    }
    if (tok.t === 'lparen') {
      this.consume();
      const inner = this.parseExpr();
      if (this.peek().t !== 'rparen') throw new Error('Expected closing parenthesis');
      this.consume();
      return inner;
    }
    if (tok.t === 'ident') {
      this.consume();
      const name = tok.v;
      if (FUNCTIONS.has(name) && this.peek().t === 'lparen') {
        this.consume();
        const args: ASTNode[] = [];
        if (this.peek().t !== 'rparen') {
          args.push(this.parseExpr());
          while (this.peek().t === 'comma') {
            this.consume();
            args.push(this.parseExpr());
          }
        }
        if (this.peek().t !== 'rparen') throw new Error('Expected closing parenthesis');
        this.consume();
        return { type: 'call', fn: name, args };
      }
      if (name in CONSTANTS) {
        return { type: 'number', value: CONSTANTS[name] };
      }
      return { type: 'variable', name };
    }
    if (tok.t === 'op' && tok.v === '-') {
      return this.parseUnary();
    }
    throw new Error(`Unexpected token: ${tok.t === 'op' ? tok.v : tok.t}`);
  }

  get done(): boolean {
    return this.peek().t === 'eof';
  }
}

export function parse(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ast: null, exprType: 'unknown', error: null };
  }

  const toksOrErr = tokenize(trimmed);
  if (typeof toksOrErr === 'string') {
    return { ast: null, exprType: 'unknown', error: toksOrErr };
  }
  const toks = toksOrErr;

  let exprType: ExpressionType = 'function';
  let inequalityOp: InequalityOp | undefined;
  let startIdx = 0;

  if (toks[0]?.t === 'ident' && toks[0].v === 'y') {
    const next = toks[1];
    if (next?.t === 'eq') {
      startIdx = 2;
      exprType = 'function';
    } else if (next?.t === 'cmp') {
      startIdx = 2;
      inequalityOp = next.v;
      exprType = 'inequality';
    }
  }

  const hasEqRemaining = toks.slice(startIdx).some((t) => t.t === 'eq');
  const hasCmpRemaining = toks.slice(startIdx).some((t) => t.t === 'cmp');
  if (hasEqRemaining || hasCmpRemaining) {
    return {
      ast: null,
      exprType: 'unknown',
      error: 'Only y = f(x) and y <op> f(x) forms are supported',
    };
  }

  const rhsToks = toks.slice(startIdx);
  if (rhsToks.length === 1 && rhsToks[0].t === 'eof') {
    return { ast: null, exprType: 'unknown', error: 'Empty right-hand side' };
  }

  const parser = new Parser(rhsToks);
  try {
    const ast = parser.parseExpr();
    if (!parser.done) {
      return { ast: null, exprType: 'unknown', error: 'Unexpected trailing input' };
    }
    return { ast, exprType, inequalityOp, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ast: null, exprType: 'unknown', error: msg };
  }
}
