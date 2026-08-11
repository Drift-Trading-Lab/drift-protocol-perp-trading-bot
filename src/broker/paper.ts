import type { Settings } from "../config/schema.js";
import type { Broker, Fill, OrderRequest } from "./types.js";

export function createPaperBroker(settings: Settings, seed = 65000): Broker {
  let equity = settings.paper.initialEquityUsd;
  let price = seed;
  let funding = 0.00015;
  const positions = new Map<string, number>();

  const bump = () => {
    price = Math.max(1, price * (1 + (Math.random() - 0.5) * 2 * settings.paper.volatility));
    funding += (Math.random() - 0.5) * 0.00004;
  };

  return {
    name: `paper:${settings.venue}`,
    async getMid() { bump(); return price; },
    async getFunding() { bump(); return funding; },
    async place(order: OrderRequest): Promise<Fill> {
      bump();
      const slip = settings.paper.slippageBps / 10_000;
      const px = order.side === "buy" ? price * (1 + slip) : price * (1 - slip);
      const amount = order.amountUsd / px;
      const fee = order.amountUsd * (settings.paper.feeBps / 10_000);
      const prev = positions.get(order.symbol) ?? 0;
      positions.set(order.symbol, prev + (order.side === "buy" ? amount : -amount));
      equity -= fee;
      return { symbol: order.symbol, side: order.side, price: px, amount, feeUsd: fee, ts: Date.now(), tag: order.tag };
    },
    equityUsd: () => equity,
    positionQty: (s) => positions.get(s) ?? 0,
  };
}
