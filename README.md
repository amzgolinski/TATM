# TATM - Trade Against the Machine

**TATM (Trade Against the Machine)** is a modern, institutional-grade algorithmic paper trading terminal, strategy backtesting engine, and portfolio management suite built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Node.js (Express)**. 

The platform features direct **Coinbase Exchange WebSocket feeds**, **7 algorithmic agent strategies**, a **deterministic multi-year backtesting simulation engine**, **autonomous bracket order (OCO) execution**, and deep qualitative market intelligence powered by **Google Gemini 3.8 Flash**.

![TATM Banner](https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80)

---

## Key Features

### 1. Real-Time Market Data & Live WebSockets
- **Live Coinbase Exchange WebSockets**: Direct, zero-authentication connection to Coinbase Exchange's public WebSocket stream (`wss://ws-feed.exchange.coinbase.com`) delivering tick-by-tick prices, trades, and 24h volume for crypto pairs (`BTC-USD`, `ETH-USD`, `SOL-USD`).
- **Resilient Connection Lifecycle**: Auto-reconnect with exponential backoff, connection state badges in the top navigation bar, and seamless fallback to stochastic Brownian motion simulation if offline.
- **Simulated Equity Market Feeds**: Sub-second micro-tick updates across US mega-caps and index ETFs (`NVDA`, `AAPL`, `MSFT`, `TSLA`, `GOOGL`, `AMZN`, `META`, `AMD`, `SPY`, `QQQ`, `JPM`, `COIN`, `LLY`).
- **Macro Market Ribbon**: Real-time tracking of the S&P 500, NASDAQ, Dow Jones, Russell 2000, 10-Yr Treasury Yield, and VIX.
- **Interactive Candlestick & Area Charting**: Multi-timeframe views (`1D`, `1W`, `1M`, `1Y`, `5Y`) with live hover crosshairs, volume bars, and technical overlays:
  - **SMA (20)** — Simple Moving Average
  - **EMA (10)** — Exponential Moving Average
  - **RSI (14)** — Relative Strength Index with 70/30 overbought & oversold thresholds
  - **TP/SL Visual Overlays** — Real-time dashed green/red reference lines and price tags on the chart for active position brackets
- **Level 2 Order Book & Live Tape**: Real-time bid/ask depth ladders with clickable prices to populate limit orders, plus a streaming Time & Sales tape.

---

### 2. Autonomous Trading Agent & 7 Strategy Archetypes
TATM features an automated strategy scanner and quantitative engine (`src/utils/quantAnalyzer.ts` & `src/components/AITradeAnalyst.tsx`) implementing 7 distinct trading agent archetypes:

1. **AI Multi-Factor Confluence (VWAP + RSI + Trend + Volume)**:
   - Evaluates a 5-factor mathematical alignment (RSI < 48, structural hold above 50-SMA, price above dynamic VWAP, and volume absorption) for high-conviction continuation.
2. **Bollinger Band Squeeze Breakout (Volatility Compression)**:
   - Identifies volatility contraction ($\text{Bandwidth} < 10.5\%$) and executes breakout longs when candles pierce the upper envelope with expanding volume.
3. **MACD Crossover Momentum (Trend Velocity)**:
   - Tracks 12-period fast EMA and 26-period slow EMA convergence, generating signals on bullish 9-period signal crossovers backed by positive histogram acceleration.
4. **VWAP Institutional Mean Reversion (Liquidity Discount)**:
   - Pinpoints assets trading at an algorithmic discount ($> 1.5\%$ below volume-weighted price) during structural bull runs to capture mean-reversion liquidity flow.
5. **RSI(14) Mean Reversion (Exhaustion Bounces)**:
   - Filters extreme oscillator exhaustion ($< 32$) with upward reversal hook confirmation.
6. **20-Day Donchian Breakout (Turtle Momentum)**:
   - Captures asymmetric multi-month equity runs on breakouts beyond rolling 20-day highs.
7. **20/50 SMA Golden Cross (Intermediate Regime)**:
   - Systematic trend-following moving average regime filter capturing medium-to-long term bullish trends.

#### Additional Agent Scanner Features:
- **Multi-Strategy Radar Matrix**: An interactive drawer ranking all 7 strategies side-by-side with individual conviction scores (0–100%) and risk/reward ratios for the active asset.
- **Live Indicator Strip**: Real-time badges for RSI(14), VWAP, 20-SMA, Bollinger Bandwidth (with automated "Squeeze" detection alerts), and MACD histogram momentum.
- **Deep AI Analysis (Gemini 3.8 Flash)**: Formulates institutional-grade qualitative trade setups, catalysts, and risk analyses grounded in live pricing and the selected strategy archetype.
- **1-Click Bracket Order Staging**: Auto-populates the order ticket with suggested entry price, position sizing, calculated Take-Profit, and Stop-Loss prices.

---

### 3. Algorithmic Backtesting Simulator
Simulate quantitative trading rules against multi-year historical candle datasets (`src/components/BacktestView.tsx` & `src/utils/backtestEngine.ts`):
- **Deterministic Indicator Engine**: Pure mathematical calculations for EMA, MACD, Bollinger Bands, and cumulative VWAP across historical bars.
- **Configurable Simulations**: Set historical ranges (1, 2, 3, or 5 Years), initial capital, position sizing percentage, slippage (0.05%), and risk brackets (TP/SL).
- **Strategy Equity Curve vs. Benchmark**: Interactive SVG chart comparing the strategy's portfolio equity trajectory against a Buy & Hold benchmark with real-time cursor inspection.
- **Comprehensive Performance KPIs**:
  - Strategy Net Return (%) & Final Capital ($)
  - Alpha vs. Buy & Hold (%)
  - Win Rate (%) & Total Trade Count (Wins / Losses)
  - Profit Factor (Gross Gains / Gross Losses)
  - Maximum Portfolio Drawdown (%)
  - Sharpe Ratio (Risk-Adjusted Return Volatility)
  - Average Trade Holding Period (Days)
- **Detailed Trade Execution Ledger**: Inspect every simulated execution with entry/exit dates, entry/exit prices, shares, dollar P&L, percentage return, and explicit exit reasons (`take_profit`, `stop_loss`, `indicator_exit`, or `end_of_period`). Filterable by **All**, **Winners**, or **Losers**.
- **Strategy Methodology Card**: Detailed breakdown of the entry rules, exit conditions, and statistical edge for each strategy.
- **1-Click Terminal Staging**: Direct button to port the backtested strategy parameters immediately into the live paper trading terminal.

---

### 4. Order Execution & Advanced Bracket Orders (OCO)
- **Order Types**: Instant **Market Orders**, working **Limit Orders**, and **Stop-Loss Protection Orders**.
- **Bracket Orders (Take-Profit & Stop-Loss)**:
  - Stage conditional Take-Profit (TP) and Stop-Loss (SL) exit orders concurrently with entry tickets.
  - **Dynamic Risk/Reward (R:R) Calculator**: Automatically calculates potential upside vs downside ratio as bracket prices are adjusted.
  - **Autonomous OCO Engine**: Position-attached TP/SL brackets are continuously evaluated against incoming ticks. When target or stop prices are breached, positions are automatically liquidated at market price and opposing bracket legs are canceled.
  - **Inline Position Bracket Management**: Easily modify, tighten, or clear TP/SL levels directly from open position rows in the portfolio.
- **Working Order Queue**: Limit orders are queued and automatically execute when market prices cross limit thresholds.
- **Quick Fill Presets**: 25%, 50%, 75%, and 100% sizing buttons scaled against real-time buying power.

---

### 5. Portfolio Tracking & Risk Analytics
- **Live Net Worth Dashboard**: Tracks total equity, cash reserve, today's P&L, unrealized returns, and realized closed gains.
- **Asset Allocation Breakdown**: Visual weighting breakdown of open positions and cash holdings.
- **Holdings Table**: Complete position inventory with direct **Buy More**, **Sell**, and inline **Bracket (TP/SL)** controls.
- **Risk Metrics**: Portfolio Beta, Sharpe Ratio estimate, and Diversification Health scoring.
- **Audited Financial Ledger**: Filterable transaction history with 1-click **CSV Export**.

---

### 6. Secure Payment & Funding Gateway (Sandbox)
- **Instant ACH Transfer (Plaid Simulation)**: Deposit funds from verified accounts (JPMorgan Chase, Bank of America, Wells Fargo) or link new accounts via cryptographic tokenization.
- **Debit / Credit Card (3D Secure 2.0)**: Test card processing with simulated SMS OTP authentication modal.
- **Instant Sandbox Grants**: 1-click +$5,000, +$25,000 (Pattern Day Trader), and +$100,000 capital grants for testing.
- **Disbursements**: Withdraw settled cash back to linked accounts with immediate buying power adjustment.
- **Client Persistence**: All balances, holdings, transactions, and watchlists are saved across browser refreshes via `localStorage`.

---

## Architecture & Tech Stack

```text
TATM Application Architecture
├── Presentation Tier (Frontend)
│   ├── React 19 (Functional Components & Custom Hooks)
│   ├── TypeScript
│   ├── Tailwind CSS v4 (Institutional Dark Financial Theme)
│   ├── Lucide React Icons
│   └── SVG Financial Charting (with TP/SL bracket visual lines & indicators)
│
├── Streaming & Market Data Tier
│   ├── Coinbase Public WebSocket (wss://ws-feed.exchange.coinbase.com)
│   │   └── Real-time crypto ticker & trade prints (BTC-USD, ETH-USD, SOL-USD)
│   └── Brownian Motion Stochastic Generator (Equities & Macro Indices)
│
├── Algorithmic & Quantitative Engine
│   ├── backtestEngine.ts (EMA, MACD, Bollinger Bands, VWAP, Sharpe Ratio, Equity Curves)
│   ├── quantAnalyzer.ts (7 Agent Strategy Archetypes, Multi-Strategy Radar Scanner)
│   └── Autonomous OCO Bracket Engine (Tick-by-tick liquidation & stop enforcement)
│
├── Middle Tier (Application Server)
│   ├── Node.js + Express
│   ├── tsx (Direct TypeScript runtime execution)
│   ├── Vite Middlewares (Unified single-port development)
│   └── Google Gen AI TypeScript SDK (@google/genai)
│       └── Gemini 3.8 Flash API (/api/analyze-stock)
│
└── Data & Execution Tier
    ├── TradingContext State Machine
    ├── Limit Order Matching Engine
    └── Browser LocalStorage Persistence
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amzgolinski/TATM.git
   cd TATM
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional for Gemini AI features):**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key from [Google AI Studio](https://aistudio.google.com/):
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   ```
   *(Note: The trading terminal, backtesting engine, bracket orders, Coinbase WebSocket feeds, and quantitative strategy scanner work 100% free out-of-the-box with zero API keys required).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   Visit `http://localhost:3000` to start trading and simulating strategies!

---

## Available Scripts

- `npm run dev`: Starts the unified Express server and Vite development server on port 3000.
- `npm run build`: Compiles production assets into `dist/`.
- `npm run lint`: Runs TypeScript validation (`tsc --noEmit`).

---

## License

This project is open source and available under the [Apache 2.0 License](LICENSE).
