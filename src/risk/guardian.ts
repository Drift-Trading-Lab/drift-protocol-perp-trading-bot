import type { Settings } from "../config/schema.js";

export type RiskState = {
  startEquity: number;
  equity: number;
  peakEquity: number;
  dailyPnl: number;
  tradesToday: number;
  halted: boolean;
  reason?: string;
};

export function createRiskState(equity: number): RiskState {
  return { startEquity: equity, equity, peakEquity: equity, dailyPnl: 0, tradesToday: 0, halted: false };
}

export function applyPnl(state: RiskState, pnl: number): void {
  state.equity += pnl;
  state.dailyPnl += pnl;
  state.peakEquity = Math.max(state.peakEquity, state.equity);
}

export function checkRisk(settings: Settings, state: RiskState, nextNotional: number): { ok: boolean; reason?: string } {
  if (settings.risk.killSwitch || state.halted) {
    state.halted = true;
    return { ok: false, reason: state.reason ?? "kill_switch" };
  }
  if (state.dailyPnl <= -settings.risk.maxDailyLossUsd) {
    state.halted = true;
    state.reason = "max_daily_loss";
    return { ok: false, reason: state.reason };
  }
  const dd = state.peakEquity <= 0 ? 0 : ((state.peakEquity - state.equity) / state.peakEquity) * 100;
  if (dd >= settings.risk.maxDrawdownPct) {
    state.halted = true;
    state.reason = "max_drawdown";
    return { ok: false, reason: state.reason };
  }
  if (nextNotional > settings.risk.maxNotionalUsd) return { ok: false, reason: "max_notional" };
  if (nextNotional > settings.risk.maxPositionUsd) return { ok: false, reason: "max_position" };
  return { ok: true };
}
