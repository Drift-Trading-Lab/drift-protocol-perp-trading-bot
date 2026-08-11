export function breakout(closes: number[], bufferPct: number): "long" | "short" | "flat" {
  if (closes.length < 6) return "flat";
  const prev = closes.slice(0, -1);
  const last = closes[closes.length - 1]!;
  const hi = Math.max(...prev);
  const lo = Math.min(...prev);
  if (last > hi * (1 + bufferPct / 100)) return "long";
  if (last < lo * (1 - bufferPct / 100)) return "short";
  return "flat";
}
