export function pickVenueMode(spreadBps: number): "clob" | "amm" {
  return spreadBps < 6 ? "clob" : "amm";
}
