# Shaked Math Core

A modern, Desmos-style graphing calculator that runs entirely in the browser. No backend, no external math libraries, just a hand-written parser and a Canvas 2D renderer.

> Live preview: [shaked-math-core.vercel.app/](https://shaked-math-core.vercel.app/)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev)
[![Node](https://img.shields.io/badge/Node-18%2B-339933.svg)](https://nodejs.org)

## Why this project

Most graphing calculators on the web are heavy, ad-laden, or require an account. Shaked Math Core is a lightweight, zero-dependency (for math) alternative focused on:

- Correct parsing of real-world math notation (implicit multiplication, right-associative `^`, unary minus).
- Smooth pan/zoom at 60fps on a 2D canvas.
- Accurate rendering of tricky functions (asymptotes, discontinuities).
- A clean, Desmos-like UI with a collapsible sidebar.
- Shareable graphs via URL hash (no database required).

## Features

- Hand-written recursive-descent parser and evaluator (only native `Math.*`).
- Functions `y = f(x)` and inequalities (`y > f(x)`, `y >= f(x)`, `y < f(x)`, `y <= f(x)`).
- Implicit multiplication: `2x`, `2(x+1)`, `(x+1)(x-1)`.
- Discontinuity detection so `tan(x)` renders gaps instead of vertical asymptote lines.
- Pan with mouse or single-finger drag, zoom with wheel or two-finger pinch.
- Square-cell grid with auto-adjusted major and minor gridlines.
- Collapsible side panel with a smooth animated mini mode (icons only).
- Undo and redo with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y).
- Settings popover: toggle grid, toggle axes, reset view.
- URL-hash persistence: share a graph by copying the link.
- Responsive layout, mobile-first (panel collapses to a bottom strip).

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm (or pnpm/yarn)

### Install and Run

```bash
git clone https://github.com/ddex3/Shaked-Math-Core.git
cd Shaked-Math-Core
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/`.

## Usage Examples

Type any of these into an expression row:

```text
y = sin(x)
y = x^2 / 4
y = (x - 3)^2 + 2
y = sin(x) * exp(-x^2 / 10)
y = 1 / (x^2 + 1)
y > x^2 - 4
y < sin(x)
```

### Supported Syntax

- Arithmetic: `+`, `-`, `*`, `/`, `^` (right-associative)
- Implicit multiplication: `2x`, `2(x+1)`, `(x+1)(x-1)`
- Functions: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `sqrt`, `abs`, `log` (base 10), `ln`, `exp`, `floor`, `ceil`
- Constants: `pi`, `e`
- Equations: `y = f(x)`
- Inequalities: `y > f(x)`, `y >= f(x)`, `y < f(x)`, `y <= f(x)`

## Project Structure

```
src/
  components/
    Canvas/            Canvas rendering
    ExpressionPanel/   Side panel with expressions
    Toolbar/           Floating zoom/reset/grid toolbar
  engine/
    parser.ts          Recursive-descent parser
    evaluator.ts       AST walker
    sampler.ts         Uniform sampling with discontinuity breaks
  hooks/
    useViewport.ts     math <-> pixel transforms
    usePointer.ts      mouse, wheel, touch handling
    useResize.ts       ResizeObserver wrapper
  store/
    graphStore.ts      Zustand store (expressions, viewport, history)
  utils/               color and math helpers
  types/               shared TypeScript types
```

## Tech Stack

- React 18 with TypeScript (strict mode)
- Vite 5 for dev server and bundling
- Zustand for state management
- Tailwind CSS for layout, CSS Modules for component styles
- HTML Canvas 2D for rendering

## Support

- Report bugs or request features on the [issue tracker](https://github.com/ddex3/Shaked-Math-Core/issues).
- Check the [live demo](https://shakedmathcore.vercel.app) to see the latest deployed version.

## License

Released under the MIT License. See [LICENSE](./LICENSE) for the full text.

---

Built with ❤️ by **[@ddex3](https://github.com/ddex3)**
