export interface SamplePoint {
  x: number;
  y: number;
  valid: boolean;
}

export function sampleFunction(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  numPoints = 800
): SamplePoint[] {
  const out: SamplePoint[] = [];
  if (!isFinite(xMin) || !isFinite(xMax) || xMax <= xMin) return out;

  const step = (xMax - xMin) / (numPoints - 1);
  const yRange = yMax - yMin;
  const jumpThreshold = 100 * yRange;
  const extremeMag = 1e6 * yRange;

  let prevValid = false;
  let prevY = NaN;

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    let y: number;
    try {
      y = fn(x);
    } catch {
      y = NaN;
    }

    let valid = isFinite(y) && Math.abs(y) < extremeMag;

    if (valid && prevValid) {
      if (Math.abs(y - prevY) > jumpThreshold) {
        out.push({ x, y: NaN, valid: false });
        out.push({ x, y, valid: true });
        prevValid = true;
        prevY = y;
        continue;
      }
    }

    out.push({ x, y, valid });
    prevValid = valid;
    prevY = y;
  }

  return out;
}
