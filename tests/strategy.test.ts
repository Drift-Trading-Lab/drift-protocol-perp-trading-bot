import test from "node:test";
import assert from "node:assert/strict";
import { loadSettings } from "../src/config/load.js";
import { createPaperBroker } from "../src/broker/paper.js";
import { createStrategy } from "../src/strategy/engine.js";
import { applyPnl, checkRisk, createRiskState } from "../src/risk/guardian.js";
import { assertLiveAllowed } from "../src/broker/live.js";

test("drift-protocol-perp-trading-bot settings", () => {
  const s = loadSettings(process.cwd());
  assert.equal(s.venue, "drift");
  assert.ok(s.risk.maxLeverage >= 1);
});

test("drift-protocol-perp-trading-bot paper steps", async () => {
  const s = loadSettings(process.cwd());
  const broker = createPaperBroker(s);
  const strat = createStrategy(s, broker);
  for (let i = 0; i < 8; i++) {
    const r = await strat.step();
    assert.ok(r.action);
  }
});

test("drift-protocol-perp-trading-bot risk trip", () => {
  const s = loadSettings(process.cwd());
  const st = createRiskState(10_000);
  applyPnl(st, -(s.risk.maxDailyLossUsd + 1));
  assert.equal(checkRisk(s, st, 100).ok, false);
});

test("drift-protocol-perp-trading-bot live gate", () => {
  const s = loadSettings(process.cwd());
  assert.throws(() => assertLiveAllowed(s, false, "DRIFT"));
});
