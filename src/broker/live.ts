import type { Settings } from "../config/schema.js";
import { hasLiveCredentials } from "../config/load.js";
import type { Broker, Fill, OrderRequest } from "./types.js";
import { createPaperBroker } from "./paper.js";

export function assertLiveAllowed(settings: Settings, confirmLive: boolean, prefix: string): void {
  if (!confirmLive && settings.live.confirmRequired) {
    throw new Error("Live mode refused: pass --confirm-live");
  }
  if (!hasLiveCredentials(prefix)) {
    throw new Error(`Live mode refused: missing ${prefix}_PRIVATE_KEY / API credentials (see .env.example)`);
  }
}

/**
 * Live adapter is fail-closed / dry-run by default.
 * Real venue signing differs per chain (HL L1, dYdX, Solana, EVM) —
 * credentials gate access; dryRunOrders simulates fills against public mids when enabled.
 */
export function createLiveBroker(settings: Settings, prefix: string): Broker {
  const paper = createPaperBroker(settings);
  return {
    name: `live:${settings.venue}`,
    getMid: (s) => paper.getMid(s),
    getFunding: (s) => paper.getFunding?.(s) ?? Promise.resolve(0),
    async place(order: OrderRequest): Promise<Fill> {
      if (settings.live.dryRunOrders) {
        const fill = await paper.place({ ...order, tag: `dryrun:${order.tag ?? ""}` });
        return fill;
      }
      throw new Error(`Live signing for ${settings.venue} not enabled — set live.dryRunOrders=true or implement venue signer (prefix=${prefix})`);
    },
    equityUsd: () => paper.equityUsd(),
    positionQty: (s) => paper.positionQty(s),
  };
}
