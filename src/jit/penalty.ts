export function applyJitPenalty(feeBps: number, jitPenaltyBps: number, preferMaker: boolean): number {
  return preferMaker ? feeBps : feeBps + jitPenaltyBps;
}
