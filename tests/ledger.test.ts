import test from "node:test";
import assert from "node:assert/strict";
import { Ledger } from "../src/accounting/ledger.js";
import { PriceSeries } from "../src/market/series.js";

test("drift-protocol-perp-trading-bot ledger", () => {
  const l = new Ledger();
  l.push({ ts: 1, action: "buy", reason: "t", pnlUsd: 1, equity: 10001 });
  assert.equal(l.summary().trades, 1);
});

test("drift-protocol-perp-trading-bot series z", () => {
  const s = new PriceSeries(10);
  for (const v of [1, 2, 3, 4, 5]) s.push(v);
  assert.ok(Number.isFinite(s.zScore()));
});
