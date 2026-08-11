import type { Ledger } from "../accounting/ledger.js";
export function formatSummary(ledger: Ledger): string {
  const s = ledger.summary();
  return `trades=${s.trades} pnl=${s.pnl.toFixed(2)} winRate=${(s.winRate * 100).toFixed(1)}%`;
}
