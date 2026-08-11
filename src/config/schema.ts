import { z } from "zod";

export const SettingsSchema = z.object({
  mode: z.enum(["paper", "live"]).default("paper"),
  venue: z.string(),
  chain: z.string(),
  model: z.string(),
  symbol: z.string(),
  loopIntervalMs: z.number().int().positive(),
  paper: z.object({
    initialEquityUsd: z.number().positive(),
    feeBps: z.number().nonnegative(),
    slippageBps: z.number().nonnegative(),
    volatility: z.number().positive(),
  }),
  risk: z.object({
    maxDailyLossUsd: z.number().positive(),
    maxDrawdownPct: z.number().positive(),
    maxNotionalUsd: z.number().positive(),
    maxPositionUsd: z.number().positive(),
    maxLeverage: z.number().positive(),
    killSwitch: z.boolean().default(false),
  }),
  live: z.object({
    confirmRequired: z.boolean().default(true),
    dryRunOrders: z.boolean().default(true),
  }),
  strategy: z.record(z.any()),
});

export type Settings = z.infer<typeof SettingsSchema>;
