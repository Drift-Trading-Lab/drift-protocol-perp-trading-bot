export type LedgerEntry = { ts: number; action: string; reason: string; pnlUsd: number; equity: number };

export class Ledger {
  readonly entries: LedgerEntry[] = [];
  push(e: LedgerEntry): void { this.entries.push(e); }
  summary() {
    const trades = this.entries.filter((e) => e.action === "buy" || e.action === "sell" || e.action === "long" || e.action === "short");
    const pnl = this.entries.reduce((s, e) => s + e.pnlUsd, 0);
    const wins = trades.filter((e) => e.pnlUsd > 0).length;
    return { trades: trades.length, pnl, winRate: trades.length ? wins / trades.length : 0 };
  }
}
