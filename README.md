# TATM - Trade Against the Machine

**TATM (Trade Against the Machine)** is a modern, full-stack paper trading terminal and portfolio management application built with **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Node.js (Express)**, featuring quantitative market analysis and AI-driven trade suggestions powered by **Google Gemini 3.8 Flash**.

![TATM Banner](https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80)

---

## Key Features

### 1. Real-Time Market Data & Streaming Engine
- **Streaming Market Tickers**: Micro-tick price updates simulated via Brownian motion across US mega-caps, index ETFs, and crypto (`NVDA`, `AAPL`, `MSFT`, `TSLA`, `GOOGL`, `AMZN`, `META`, `AMD`, `SPY`, `QQQ`, `BTC-USD`, `ETH-USD`, `JPM`, `COIN`, `LLY`).
- **Macro Market Ribbon**: Real-time tracking of the S&P 500, NASDAQ, Dow Jones, Russell 2000, 10-Yr Treasury Yield, and VIX.
- **Interactive Candlestick & Area Charting**: Multi-timeframe views (`1D`, `1W`, `1M`, `1Y`, `5Y`) with live hover crosshairs and technical overlays:
  - **SMA (20)** — Simple Moving Average
  - **EMA (10)** — Exponential Moving Average
  - **RSI (14)** — Relative Strength Index with 70/30 overbought & oversold thresholds
  - **Volume** — Real-time volume bars
- **Level 2 Order Book & Live Tape**: Real-time bid/ask depth ladders with clickable prices to populate limit orders, plus a streaming Time & Sales tape.

### 2. Trading Execution Terminal
- **Order Types**: Instant **Market Orders**, working **Limit Orders**, and **Stop-Loss Protection Orders**.
- **Working Order Matching Engine**: Limit orders are queued and automatically execute when the market price reaches your target limit price.
- **Quick Fill Presets**: 25%, 50%, 75%, and 100% buttons to size trades against available buying power.
- **Real-Time Position Recalculation**: Instant execution feedback with automatic updates to cash balances, cost basis, and unrealized P&L.

### 3. Portfolio Tracking & Risk Analytics
- **Live Net Worth Dashboard**: Tracks total equity, cash reserve, today's P&L, unrealized returns, and realized closed gains.
- **Asset Allocation Breakdown**: Visual weighting breakdown of open positions and cash holdings.
- **Holdings Table**: Complete position inventory with direct **Buy More** and **Sell** triggers.
- **Risk Metrics**: Portfolio Beta, Sharpe Ratio estimate, and Diversification Health scoring.
- **Audited Financial Ledger**: Filterable transaction history with 1-click **CSV Export**.

### 4. Quantitative Strategy & AI Trade Suggestions
- **Technical Market Scanner**: Evaluates momentum divergence, support/resistance levels, and moving average alignments.
- **Deep AI Trade Analysis**: Server-side integration with **Gemini 3.8 Flash** via `@google/genai` to generate high-conviction trade setups with:
  - Suggested Entry Price
  - Take-Profit Target & Implied Upside %
  - Stop-Loss Risk Level & Max Loss %
  - Risk/Reward Ratio (e.g. `1 : 2.8`)
  - Fundamental & Technical Catalyst Summary
- **1-Click Staging**: Press **"Stage in Order Ticket"** to automatically pre-fill the trade terminal with the AI's exact recommendation.

### 5. Secure Payment & Funding Gateway (Sandbox)
- **Instant ACH Transfer (Plaid Simulation)**: Deposit funds from verified accounts (JPMorgan Chase, Bank of America, Wells Fargo) or link new accounts via cryptographic tokenization.
- **Debit / Credit Card (3D Secure 2.0)**: Test card processing with simulated SMS OTP authentication modal.
- **Instant Sandbox Grants**: 1-click +$5,000, +$25,000 (Pattern Day Trader), and +$100,000 capital grants for stress-testing.
- **Disbursements**: Withdraw settled cash back to linked accounts with immediate buying power adjustment.
- **Client Persistence**: All balances, holdings, transactions, and watchlists are saved across browser refreshes via `localStorage`.

---

## Architecture & Tech Stack

```text
AuraTrade Application Architecture
├── Presentation Tier (Frontend)
│   ├── React 19 (Functional Components & Custom Hooks)
│   ├── TypeScript
│   ├── Tailwind CSS v4 (Institutional Dark Financial Theme)
│   ├── Lucide React Icons
│   └── High-Performance SVG Financial Charting
│
├── Middle Tier (Application Server)
│   ├── Node.js + Express
│   ├── tsx (Direct TypeScript runtime execution)
│   ├── Vite 8 Middlewares (Unified single-port development)
│   └── Google Gen AI TypeScript SDK (@google/genai)
│       └── Gemini 3.8 Flash API (/api/analyze-stock)
│
└── Data & Persistence Tier
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
   *(Note: The trading terminal and technical quantitative scanner work out-of-the-box even without an API key using the built-in heuristic engine).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   Visit `http://localhost:3000` to start trading!

---

## Available Scripts

- `npm run dev`: Starts the unified Express server and Vite development server on port 3000.
- `npm run build`: Compiles production assets into `dist/`.
- `npm run lint`: Runs TypeScript validation (`tsc --noEmit`).

---

## License

This project is open source and available under the [Apache 2.0 License](LICENSE).
