// Smooth curve that never overshoots the data (monotone cubic, Fritsch–Carlson)
export function monotonePath(xs: number[], ys: number[]) {
  const n = xs.length;
  const m = xs.slice(0, -1).map((x, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - x));
  const t = xs.map((_, i) => (i === 0 ? m[0] : i === n - 1 ? m[n - 2] : m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2));
  m.forEach((mi, i) => {
    if (mi === 0) { t[i] = t[i + 1] = 0; return; }
    const a = t[i] / mi, b = t[i + 1] / mi, s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * mi; t[i + 1] = k * b * mi; }
  });
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const dx = (xs[i + 1] - xs[i]) / 3;
    d += ` C${xs[i] + dx},${ys[i] + t[i] * dx} ${xs[i + 1] - dx},${ys[i + 1] - t[i + 1] * dx} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}
