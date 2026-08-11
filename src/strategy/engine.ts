import type { Settings } from "../config/schema.js";
import type { Broker } from "../broker/types.js";
import { PriceSeries } from "../market/series.js";
import { pickVenueMode } from "../hybrid/mode.js";
import { applyJitPenalty } from "../jit/penalty.js";
import { breakout } from "../signals/breakout.js";
import { cappedLeverage } from "../risk/leverageCap.js";

export type LoopResult = { action: string; reason: string; pnlUsd: number };

export function createStrategy(settings: Settings, broker: Broker) {
  const st = settings.strategy as any;
  const series = new PriceSeries(24);
  let open: { side: "buy" | "sell"; entry: number; notional: number; stop: number; tp: number } | null = null;

  return {
    async step(): Promise<LoopResult> {
      const mid = await broker.getMid(settings.symbol);
      series.push(mid);
      const spread = 3 + Math.random() * 8;
      const mode = pickVenueMode(spread);
      const fee = applyJitPenalty(settings.paper.feeBps, st.jitPenaltyBps ?? 8, !!st.preferMaker && mode === "clob");

      if (open) {
        const hitTp = open.side === "buy" ? mid >= open.tp : mid <= open.tp;
        const hitSl = open.side === "buy" ? mid <= open.stop : mid >= open.stop;
        if (hitTp || hitSl) {
          const side = open.side === "buy" ? "sell" : "buy";
          const fill = await broker.place({ symbol: settings.symbol, side, amountUsd: open.notional, tag: hitTp ? "tp" : "sl" });
          const dir = open.side === "buy" ? 1 : -1;
          const pnl = dir * ((mid - open.entry) / open.entry) * open.notional - fill.feeUsd;
          open = null;
          return { action: side, reason: `${hitTp ? "tp" : "sl"}|${mode}`, pnlUsd: pnl };
        }
        return { action: "hold", reason: `in_trade|${mode}`, pnlUsd: 0 };
      }

      const sig = breakout(series.closes(), st.breakoutBufferPct ?? 0.15);
      if (sig === "flat") return { action: "hold", reason: `no_setup|${mode}|fee=${fee}`, pnlUsd: 0 };
      const side = sig === "long" ? "buy" : "sell";
      const notional = Math.min(broker.equityUsd() * ((st.riskPerTradePct ?? 0.4) / 100), settings.risk.maxPositionUsd);
      const lev = cappedLeverage(3, settings.risk.maxLeverage);
      const fill = await broker.place({ symbol: settings.symbol, side, amountUsd: notional, tag: `${sig}|${mode}`, leverage: lev });
      const stopDist = mid * 0.005;
      open = {
        side,
        entry: mid,
        notional,
        stop: side === "buy" ? mid - stopDist * (st.stopLossR ?? 1) : mid + stopDist * (st.stopLossR ?? 1),
        tp: side === "buy" ? mid + stopDist * (st.takeProfitR ?? 1.8) : mid - stopDist * (st.takeProfitR ?? 1.8),
      };
      return { action: side, reason: `${sig}|${mode}`, pnlUsd: -fill.feeUsd };
    },
  };
}
