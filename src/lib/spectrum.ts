/**
 * The frequency bins an analyser reports, folded into the bars on the stage.
 *
 * Bins are linear in frequency, hearing isn't: a straight split would give the
 * bass three bars and the hiss thirty. Bars are spaced logarithmically (at
 * least one bin each) from the lowest bin to about 80% of the range (the top is mostly empty in a
 * compressed preview), each the loudest bin in its span, 0..1.
 */
export function bandLevels(bins: ArrayLike<number>, bars: number): number[] {
  const n = bins.length;
  if (n === 0 || bars <= 0) return [];
  const top = Math.max(2, Math.floor(n * 0.8));
  const out: number[] = [];
  // each bar starts where the last one ended — at the bass end the log steps
  // are narrower than a bin, and bars used to share (and repeat) the same one
  let lo = 1;
  for (let b = 0; b < bars; b++) {
    const hi = Math.max(lo + 1, Math.floor(Math.pow(top, (b + 1) / bars)));
    let peak = 0;
    for (let i = lo; i < Math.min(hi, n); i++) peak = Math.max(peak, bins[i]);
    out.push(peak / 255);
    lo = hi;
  }
  return out;
}
