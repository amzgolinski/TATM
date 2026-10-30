# TATM - Trade Against the Machine
## Executive System Overview & Architecture Handbook

> **Version:** 1.2.0 (Production-Hardened)  
> **Framework:** React 19 · TypeScript · Tailwind CSS v4 · Express · Vite 8  
> **Status:** Feature Complete & Deployment Ready  

---

## 1. Executive Summary

**TATM (Trade Against the Machine)** is a full-stack algorithmic paper trading terminal, automated trading agent, and deterministic backtesting simulator. It bridges the gap between discretionary retail charting and systematic institutional quantitative trading.

The platform is designed to operate **100% free and autonomously out of the box** without requiring API keys for baseline trading, while maintaining a clean, plug-and-play adapter architecture to seamlessly route orders to real-world brokerages like **Alpaca Markets** and **Coinbase Advanced Trade**.

---

## 2. Full Architecture Blueprint

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TATM SYSTEM ARCHITECTURE MAP                          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│  PRESENTATION TIER   │    │  QUANTITATIVE AGENT  │    │  BACKTESTING ENGINE │
│  (React 19 + Tailwind)│   │  (7 Algorithmic Bots)│    │  (Multi-Year Sim)   │
│                      │    │                      │    │                     │
│ • Interactive Chart  │    │ • Multi-Factor Conf. │    │ • Pure Math History │
│ • TP/SL Overlays     │    │ • Bollinger Squeeze  │    │ • Benchmark vs Alpha│
│ • Order Book & Tape  │    │ • VWAP Reversion     │    │ • Sharpe & Drawdown │
│ • Bot Command Desk   │    │ • MACD Momentum      │    │ • Trade Ledger      │
│ • Portfolio & Ledger │    │ • RSI Exhaustion     │    │ • 1-Click Staging   │
└──────────┬───────────┘    └──────────┬───────────┘    └──────────┬──────────┘
           │                           │                           │
           └───────────────────────────┼───────────────────────────┘
                                       ▼
                       ┌───────────────────────────────┐
                       │   EXECUTION & OCO ROUTER      │
                       │   • One-Cancels-the-Other     │
                       │   • Tick Liquidation Engine   │
                       │   • Risk & Panic Kill Switch  │
                       └───────────────┬───────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌───────────────────────────────┐
│  STREAMING MARKET DATA TIER  │              │    BROKERAGE ADAPTER TIER     │
│  • Coinbase Public WebSocket │              │    • TATM Internal Paper      │
│    (BTC, ETH, SOL ticks)     │              │    • Alpaca Markets REST      │
│  • Brownian Motion Engine    │              │      (Native Bracket Orders)  │
│    (US Equities & Macro)     │              │    • Coinbase Advanced Trade  │
└──────────────────────────────┘              └───────────────────────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────────┐
                       │  MIDDLE TIER & CLOUD RUN      │
                       │  • Express HTTP (Port 3000)   │
                       │  • Health Probes (/healthz)   │
                       │  • Cache Pruning (20-min TTL) │
                       │  • Gemini 3.8 Flash Proxy     │
                       │  • SIGTERM Graceful Shutdown  │
                       └───────────────────────────────┘
```

---

## 3. Subsystem Breakdown & Key Features

### 3.1. Autonomous Bot Station (`src/components/AgentBotView.tsx`)
- **Master Switch Control**: One-click `ARM / START` and `PAUSE` toggle with an animated pulsing status LED.
- **Panic Kill Switch**: Emergency stop button that immediately halts all automated routines, cancels pending bracket orders, and emits an audible alarm.
- **Live Telemetry Stream**: Dark-theme console outputting real-time decision logs:
  - `[SCAN]`: Periodic heartbeat monitoring asset criteria against thresholds.
  - `[SIGNAL]`: Confluence detection alerts when a strategy setup triggers.
  - `[EXECUTE]`: Automated order placements with execution price and attached brackets.
  - `[OCO_EXIT]`: Triggered when market ticks breach a Take-Profit or Stop-Loss level.
  - `[REJECT]`: Risk ceiling or cooldown violations logged transparently.
- **Institutional Guardrails**:
  - *Minimum Conviction Threshold* (75% to 95%)
  - *Maximum Allocation per Position* ($500 to $10,000 hard ceiling)
  - *Maximum Concurrent Positions* (1 to 6)
  - *Symbol Cooldown Period* (30s to 300s)
  - *Take-Profit Offset* (+3% to +15%) & *Stop-Loss Limit Offset* (-1.5% to -8%)

### 3.2. Quantitative Strategy Models (`src/utils/quantAnalyzer.ts`)
TATM implements 7 deterministic mathematical trading strategies:

1. **AI Multi-Factor Confluence (VWAP + RSI + 50-SMA + Volume)**: Combines 5 independent factors to capture high-probability trend acceleration.
2. **Bollinger Band Squeeze Breakout**: Monitors 20-period standard deviation compression ($\text{Bandwidth} < 10.5\%$) and enters on envelope expansion.
3. **VWAP Institutional Mean Reversion**: Exploits dealer inventory imbalances when price trades $> 1.5\%$ discounted below the intraday volume-weighted average price.
4. **MACD Crossover Momentum**: Enforces 12/26 EMA line convergence and positive 9-period histogram acceleration.
5. **RSI(14) Mean Reversion**: Enters oversold pullbacks ($< 32$) upon reversal hook confirmation.
6. **20-Day Donchian Breakout**: Classic trend-following model capturing multi-month equity runs above rolling 20-day highs.
7. **20/50 SMA Golden Cross**: Robust intermediate macro trend regime filter.

### 3.3. Deterministic Backtesting Simulator (`src/components/BacktestView.tsx` & `src/utils/backtestEngine.ts`)
- **Mathematical Indicator Engine**: Pure formulas for EMA, MACD, Bollinger Bands, and cumulative VWAP across historical bars.
- **Strategy vs. Buy & Hold Curve**: Interactive SVG chart mapping portfolio trajectory against buy-and-hold benchmarks.
- **Performance KPIs**: Net Return %, Alpha vs. Benchmark %, Win Rate %, Profit Factor, Max Drawdown %, and Sharpe Ratio.
- **Audited Trade Ledger**: Inspects every simulated entry/exit, holding days, and exit triggers (`take_profit`, `stop_loss`, `indicator_exit`, `end_of_period`).
- **1-Click Staging**: Transmits proven backtest parameters directly into the live paper trading terminal.

### 3.4. Advanced Order Execution & OCO Brackets (`src/context/TradingContext.tsx`)
- **Order Types**: Market Orders, working Limit Orders, Stop-Loss Protection Orders, and conditional Bracket Orders.
- **Autonomous One-Cancels-the-Other (OCO) Engine**: Position-attached TP/SL brackets are continuously evaluated against tick streams. When one leg triggers, the position liquidates at market and the opposite leg cancels automatically.
- **Visual Chart Overlays**: Dashed green and red reference lines with price tags rendered directly on the candlestick chart.
- **Dynamic Risk/Reward Calculator**: Measures real-time reward-to-risk ratio as bracket prices are adjusted.

### 3.5. Web Audio API Synthesizer (`src/utils/audioAlerts.ts`)
- Pure browser Web Audio API synthesis (zero external `.mp3` or `.wav` dependencies).
- Dual-harmonic sine tones for trade execution, crisp blips for signals, and sawtooth alarms for kill-switch activation.

### 3.6. Market Data Feeds (`src/services/coinbaseFeed.ts`)
- **Live Crypto Feeds**: Direct, public WebSocket connection to Coinbase Exchange (`wss://ws-feed.exchange.coinbase.com`) for `BTC-USD`, `ETH-USD`, and `SOL-USD`.
- **Equities Simulation**: Stochastic Geometric Brownian motion micro-tick generator simulating realistic market auctions for US mega-caps (`NVDA`, `AAPL`, `MSFT`, `TSLA`, `SPY`, etc.).

### 3.7. Sandbox Capital & Funding Gateway (`src/components/FundingView.tsx`)
- Instant ACH transfers (Plaid simulation) with account tokenization.
- Credit/Debit card simulation with 3D Secure 2.0 SMS OTP modal.
- Sandbox capital grants (+$5k, +$25k PDT threshold, +$100k institutional fund).
- Client-side persistence in `localStorage` across page refreshes.

---

## 4. Live Brokerage Migration Guide

TATM is built with a clean provider interface in `src/services/brokerAdapter.ts`. To switch from local paper trading to real capital:

### 4.1. Alpaca Markets (US Equities & Crypto)
1. Sign up at [Alpaca Markets](https://alpaca.markets/).
2. Obtain your `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`.
3. In `src/services/brokerAdapter.ts`, the order dispatcher prepares the native Alpaca bracket order format:
   ```json
   {
     "symbol": "NVDA",
     "qty": 15,
     "side": "buy",
     "type": "market",
     "time_in_force": "gtc",
     "order_class": "bracket",
     "take_profit": { "limit_price": 146.50 },
     "stop_loss": { "stop_price": 134.10 }
   }
   ```
4. Transmit this payload to `POST https://paper-api.alpaca.markets/v2/orders` (for paper testing) or `https://api.alpaca.markets/v2/orders` (for real money).

### 4.2. Coinbase Advanced Trade (Crypto)
1. Sign up for [Coinbase Advanced](https://www.coinbase.com/advanced-trade).
2. Create an API key with Trading permissions.
3. The broker adapter matches the existing `BTC-USD`, `ETH-USD`, and `SOL-USD` stream and formats orders for `POST https://api.coinbase.com/api/v3/brokerage/orders`.

---

## 5. Google Cloud Run Deployment Guide

To deploy TATM live on Google Cloud Run with 24/7 uninterrupted bot scanning:

```bash
gcloud run deploy tatm-trading \
  --source . \
  --region us-east4 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --min-instances 1 \
  --no-cpu-throttling \
  --memory 512Mi \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### Critical Flags Explained:
- `--min-instances 1`: Prevents the container from scaling to zero so the bot never sleeps.
- `--no-cpu-throttling`: Allocates continuous CPU cycles for background WebSockets and strategy algorithms.
- `--region us-east4`: Northern Virginia datacenter (lowest latency to NYSE, NASDAQ, and Coinbase nodes).
- `/healthz` & `/api/health`: Built-in container probes reporting process uptime and memory health.

---

## 6. Directory Map & Code Reference

```text
/
├── server.ts                       # Express backend, healthchecks, Yahoo Finance proxy, Vite dev mount
├── src/
│   ├── components/
│   │   ├── AgentBotView.tsx        # Autonomous Bot Command Center & Telemetry Console
│   │   ├── AITradeAnalyst.tsx      # Quantitative Strategy Scanner & Multi-Agent Radar
│   │   ├── BacktestView.tsx        # Multi-Year Backtesting Simulator & Performance KPIs
│   │   ├── StockChart.tsx          # SVG Candlestick / Line Chart with dynamic TP/SL overlays
│   │   ├── TradingTerminal.tsx     # Order placement ticket with bracket controls & R:R calculator
│   │   ├── PortfolioView.tsx       # Live holdings, risk metrics (Beta, Sharpe), and inline brackets
│   │   ├── OrdersAndLedgerView.tsx # Audited transaction history & working orders with CSV export
│   │   ├── FundingView.tsx         # Sandbox ACH, 3D Secure Card, and capital grants
│   │   ├── TopBar.tsx              # Macro market ticker, account stats, and live Bot Pulse indicator
│   │   └── WatchlistSidebar.tsx    # Real-time asset search, watchlists, and quotes
│   │
│   ├── context/
│   │   └── TradingContext.tsx      # Core state machine, autonomous OCO engine, bot runner loop
│   │
│   ├── services/
│   │   ├── brokerAdapter.ts        # Clean provider schemas for Alpaca Markets & Coinbase Advanced
│   │   └── coinbaseFeed.ts         # Resilient Coinbase Exchange WebSocket stream with backoff
│   │
│   ├── utils/
│   │   ├── audioAlerts.ts          # Pure Web Audio API synthesized chimes & alerts
│   │   ├── backtestEngine.ts       # Mathematical indicators (EMA, MACD, BB, VWAP) & sim runner
│   │   └── quantAnalyzer.ts        # 7 Strategy Archetypes, scoring algorithms, and radar scanner
│   │
│   └── types/
│       ├── bot.ts                  # Bot configuration, telemetry logs, and broker schemas
│       └── market.ts               # Quotes, candles, order books, positions, and orders
│
├── package.json                    # Scripts: dev, start, build, lint
├── README.md                       # High-level feature guide & installation steps
└── OVERVIEW.md                     # Complete handover handbook (this file)
```

---

## 7. Developer Handover Checklist

When picking up this project in the future:
- [x] **Dev Server**: `npm run dev` boots the unified Express + Vite server on `http://localhost:3000`.
- [x] **Build & Lint**: `npm run lint` (`tsc --noEmit`) and `npm run build` pass with zero errors.
- [x] **Zero Mock Secrets**: Public WebSockets and quantitative rules operate without API keys. Gemini AI features auto-activate when `GEMINI_API_KEY` is present.
- [x] **State Persistence**: Browser `localStorage` maintains all paper balances and bot logs. To clear or reset, click the **Reset Demo Account** button in the top navigation bar.
- [x] **Broker-Agnostic**: All order routing is decoupled via `src/services/brokerAdapter.ts`.

---

*Handover complete. TATM is hardened, fully documented, and ready for deployment.*
