export function cappedLeverage(req: number, max: number): number {
  return Math.max(1, Math.min(req, max));
}
