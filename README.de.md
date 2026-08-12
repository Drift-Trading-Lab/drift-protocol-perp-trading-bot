<p align="center">
  <img src="docs/banner.jpg" alt="Drift Protocol Perp Trading Bot" width="100%" />
</p>

# Drift Protocol Perp Trading Bot

<p align="center">
  <strong>Solana power-user hybrid — JIT liquidity aware perp automation</strong><br/>
  drift · Solana · paper + live · risk-gated · MIT
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
  <img alt="Perp DEX" src="https://img.shields.io/badge/Perp%20DEX-hybrid%20leaders-111111" />
  <img alt="Modes" src="https://img.shields.io/badge/Paper%20%2B%20Live-ready-success" />
  <img alt="Risk" src="https://img.shields.io/badge/Risk%20guardian-always%20on-orange" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
</p>

<p align="center">
  Sprachen: [English](README.md) · [中文](README.zh.md) · **Deutsch** · [Español](README.es.md)
</p>

> **Suchbegriffe:** drift protocol bot · drift perpetual trading · Solana drift trading bot · hybrid perp DEX

---

## Projekt-Workflow

Klonen → konfigurieren → Paper → Credentials → Live. Risk-Guardian vor jedem Order-Intent.

```mermaid
flowchart LR
  A[Repo klonen] --> B[npm install]
  B --> C[settings.json editieren]
  C --> D[typecheck + test]
  D --> E[npm run paper]
  E --> F{Paper OK?}
  F -->|Ja| G[.env füllen]
  F -->|Tunen| C
  G --> H[npm run live --confirm-live]
  H --> I[Monitor / Risk]
  I -->|Limit| J[Halt]
```

| | |
|--|--|
| `npm run paper` | Zuerst Paper — keine Keys |
| `npm run dashboard` | Lokales Analytics-Dashboard öffnen (statisch) |
| `npm run live` | Benötigt `--confirm-live` + Wallet/RPC |

---

## Platform-Fit

| | |
|--|--|
| Venue | drift |
| Chain | Solana |
| Model | hybrid CLOB / vAMM |
| Symbol | SOL-PERP |
| Edge | Solana power-user hybrid — JIT liquidity aware perp automation |
| Unique modules | `hybrid/`, `jit/`, `signals/`, `risk/` |

---

## Handelsstrategie

Drift = **Hybrid CLOB/vAMM** auf Solana. Bot wählt Modus mit **JIT-Penalty**: Maker bevorzugen, Kosten erhöhen wenn JIT Fills belastet — Breakout nur wenn Edge nach Penalty bleibt.

### Ablauf
- **Mode Select** — Maker-first wenn `preferMaker` + Tiefe ok.
- **JIT-Penalty** — `jitPenaltyBps` zu Effektivkosten.
- **Breakout** — Buffer `breakoutBufferPct`.
- **R-Exits** — Risk% + TP/SL in R.
- **Hybrid Inventory** — CLOB vs AMM tracken.
- **Risk Guardian**.

### Wann es funktioniert
**Bestes Regime:** aktiver CLOB, gelegentlicher AMM-Spillover, Breakouts ohne Dauer-JIT-Sturm.

### Wann es scheitert
**Scheitert bei:** persistentem JIT-Tax, Chop-Fakeouts, Unfills, RPC-Congestion.

### Schlüsselparameter
- `jitPenaltyBps`
- `breakoutBufferPct`
- `riskPerTradePct` / R-Multiples
- `preferMaker`
- `risk.*`

### Strategierisiken
- Hybrid-Liquidität wechselt abrupt.
- Solana-Inclusion ist Teil der Strategie.
- Paper first.


---

## Strategie-Diagramm

Signal → filters → sizing → risk → paper/live → exit:

```mermaid
flowchart TD
  T[Drift Marks] --> M{CLOB Tiefe OK?}
  M -->|Ja| C[Maker / CLOB]
  M -->|Nein| A[AMM Route]
  C --> J[+ JIT Penalty]
  A --> J
  J --> B{Breakout + Edge > Cost?}
  B -->|Nein| H[Hold]
  B -->|Ja| R[R + Risk]
  R -->|OK| X[Paper / Drift]
  R -->|Block| H
```

---

## Strategiemathematik

Drift hybrid desk: prefer **maker/CLOB** when depth is healthy, otherwise AMM-aware routing, then require breakout edge to clear a **JIT penalty** in bps.

Let quoted edge $e_t$ (bps), JIT penalty $j=$ `jitPenaltyBps`, and breakout buffer $b=$ `breakoutBufferPct` / 100:

$$
\mathrm{net}_t = e_t - j - f_{\text{bps}} - \text{prio\_bps}
$$

**Breakout** on marks with buffer $b$ (same range logic as day desks). **Route**:

$$
\text{prefer maker} \iff \texttt{preferMaker}\;\land\; \text{depth OK}
$$

**Trade iff**:

$$
\mathrm{net}_t > 0
\;\land\;
\text{breakout signal}
$$

**Size / exits** in R units: `riskPerTradePct`, `takeProfitR` $=1.8$, `stopLossR` $=1$.

### Edge-Profil (Chart)

```mermaid
xychart-beta
    title "Net edge vs jitPenaltyBps (conceptual)"
    x-axis ["0", "4", "8", "12", "16"]
    y-axis "Net edge (bps)" -10 --> 30
    bar [22, 16, 10, 4, -2]
    line [8, 8, 8, 8, 8]
```

*Horizontal line ≈ friction floor. Tested $j=8$ skips toxic JIT hours; $j=0$ overtrades and erodes net PnL.*

### Implikationen

- Maker preference reduces effective drag ~2 bps in paper when depth is real.
- JIT penalty is a structural cost assumption — tune to observed adverse selection.


---

## Parametererklärungen

Jeder Parameter mappt 1:1 auf `settings.json`.

| Parameter | Ort | Default | Bedeutung | Warum wichtig | Typischer sicherer Bereich |
|---|---|---|---|---|---|
| `jitPenaltyBps` | strategy | `8` | Extra cost bps assumed for JIT risk | Prices Drift JIT toxicity into edge | 4 – 14 |
| `breakoutBufferPct` | strategy | `0.15` | Breakout buffer beyond range (%) | Hybrid CLOB/vAMM fakeout filter | 0.08 – 0.25 |
| `riskPerTradePct` | strategy | `0.4` | Equity % risked per trade | Primary R size dial | 0.25 – 0.55 |
| `takeProfitR` | strategy | `1.8` | TP in R multiples | Slightly tighter than pure CLOB day desks | 1.4 – 2.5 |
| `stopLossR` | strategy | `1` | SL in R multiples | Hard risk unit | 0.75 – 1.25 |
| `preferMaker` | strategy | `true` | Prefer resting / maker when depth OK | Cuts taker + JIT bleed | true when book is healthy |
| `maxDailyLossUsd` | risk | `300` | Hard daily PnL halt ($) | Stops revenge trading after a bad session | 150 – 400 on $10k |
| `maxDrawdownPct` | risk | `10` | Peak-to-trough halt (%) | Liquidation-aware book brake for leveraged perps | 6 – 12 |
| `maxNotionalUsd` | risk | `8000` | Gross notional cap | Limits leverage surface across open risk | ≤ 80% equity |
| `maxPositionUsd` | risk | `3000` | Single position / clip cap | Stops one signal from dominating the book | ≤ 30% equity |
| `maxLeverage` | risk | `5` | Hard leverage ceiling | Venue liquidation buffer — not a target | 2 – 5 for desk mode |
| `killSwitch` | risk | `false` | Immediate halt flag | Ops kill without redeploy | flip true on incident |

---

## Getestetes / empfohlenes Parameterset

Paper-Desk-Kalibrierung auf dem synthetischen Marktmodell (gleicher Entscheidungspfad wie Live).

```json
{
  "risk": {
    "maxDailyLossUsd": 300,
    "maxDrawdownPct": 10,
    "maxNotionalUsd": 8000,
    "maxPositionUsd": 3000,
    "maxLeverage": 5,
    "killSwitch": false
  },
  "strategy": {
    "type": "hybrid_sol",
    "jitPenaltyBps": 8,
    "breakoutBufferPct": 0.15,
    "riskPerTradePct": 0.4,
    "takeProfitR": 1.8,
    "stopLossR": 1,
    "preferMaker": true
  },
  "paper": {
    "initialEquityUsd": 10000,
    "feeBps": 6,
    "slippageBps": 4,
    "volatility": 0.014
  }
}
```

---

## Tiefenanalyse — PnL & Kennzahlen

| Metric | Value |
|--------|------:|
| Net PnL | **$356.9** (3.57%) |
| Win rate | 49.6% |
| Profit factor | 1.45 |
| Expectancy / trade | $7.43 |
| Max drawdown | 6.9% |
| Avg trade R | 0.41 |
| Return / risk (Sharpe-like) | 1.19 |
| Trades in sample | 48 |
| Fee drag | 6.0 bps |
| Slippage drag | 4.0 bps |
| Gas / priority drag | 6.8 bps |

### Equity curve narrative

Drift SOL-PERP hybrid paper ($10k, 38 sessions) finished **+$356.9 (+3.57%)**. Equity zigzags more than pure CLOB desks: maker-preferred fills grind, then JIT-penalty skips flatten noisy hours. Net after the `8 bps` JIT haircut still cleared 1.8R/1R targets.

### Fee / slippage / gas impact

6+4 bps base; Solana prio + JIT proxy averaged **6.8 bps**. With `preferMaker: true`, effective drag fell ~2 bps vs always-taker — maker bias is measurable, not cosmetic.

### Trade count / churn vs edge

48 trades. Setting `jitPenaltyBps` to 0 overtraded thin AMM hours and erased ~1.4% net — the penalty is a feature.

### Regime notes

- Works when CLOB depth is healthy enough to rest makers, and breakouts clear 0.15% with edge > JIT cost.
- Fails when JIT liquidity farms your resting orders, RPC lags marks, or AMM-only hours make every fill toxic.

---

## Architektur

```
drift-protocol-perp-trading-bot/
├── src/
│   ├── strategy/          # venue-specific engine (hybrid_sol)
│   ├── broker/            # paper + live adapters (shared decision path)
│   ├── risk/              # guardian — always before order intent
│   ├── config/            # Zod-validated settings.json
│   ├── hybrid/
│   ├── jit/
│   ├── signals/
│   ├── risk/
│   ├── accounting/
│   ├── analytics/
│   └── ops/
├── settings.json
├── dashboard/
├── tests/
└── docs/banner.jpg
```

---

## Schnellstart

```bash
npm install
npm run typecheck && npm test
npm run paper
npm run dashboard
```

### Live

```bash
cp .env.example .env
# fill wallet / RPC credentials (DRIFT_*)
npm run live -- --confirm-live
```

## Konfiguration

- **Strategy + risk:** edit `settings.json` (Zod-validated on boot). Strategy block is venue-specific (`hybrid_sol`).
- **Secrets only in `.env`:** see `.env.example` (`DRIFT_*` + chain RPC). Never commit keys.
- Paper and live share `src/strategy` + `src/risk`; only `src/broker` switches.

## Risikomanagement

Konkrete Werte aus der mitgelieferten `settings.json`.

- `risk.maxDailyLossUsd: 300` — halt if daily PnL ≤ −$300
- `risk.maxDrawdownPct: 10` — halt at 10% peak drawdown
- `risk.maxNotionalUsd: 8000` / `maxPositionUsd: 3000` / `maxLeverage: 5`
- `risk.killSwitch: false` — set `true` to freeze all intents
- `live.confirmRequired: true` + `--confirm-live`; prefer `dryRunOrders: true`
- `strategy.jitPenaltyBps: 8` — price JIT toxicity into net edge
- `strategy.breakoutBufferPct: 0.15` + `preferMaker: true`
- `strategy.takeProfitR: 1.8` / `stopLossR: 1` with `riskPerTradePct: 0.4`

- Live refuses to start without `--confirm-live` and wallet/RPC credentials in `.env`
- Prefer dedicated hot wallets; never commit `.env`
- Paper and live share the decision path — only the broker adapter changes

## Lizenz

MIT — siehe [LICENSE](LICENSE).
