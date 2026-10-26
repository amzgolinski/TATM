import React from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { TopBar } from './components/TopBar';
import { MarketTickerBar } from './components/MarketTickerBar';
import { WatchlistSidebar } from './components/WatchlistSidebar';
import { StockChart } from './components/StockChart';
import { TradingTerminal } from './components/TradingTerminal';
import { OrderBookAndTape } from './components/OrderBookAndTape';
import { StockFundamentals } from './components/StockFundamentals';
import { AITradeAnalyst } from './components/AITradeAnalyst';
import { PortfolioView } from './components/PortfolioView';
import { OrdersAndLedgerView } from './components/OrdersAndLedgerView';
import { FundingView } from './components/FundingView';
import { BacktestView } from './components/BacktestView';
import { PaymentModal } from './components/PaymentModal';
import { ToastContainer } from './components/ToastContainer';

const MainContent: React.FC = () => {
  const { activeTab } = useTrading();

  return (
    <main className="max-w-[1720px] mx-auto p-4 sm:p-6 w-full flex-1">
      {activeTab === 'terminal' && (
        <div className="space-y-6">
          {/* Main 3-Column Trading Terminal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Watchlist & Search (3 cols) */}
            <div className="lg:col-span-3 h-[740px]">
              <WatchlistSidebar />
            </div>

            {/* Middle Column: Interactive Chart (6 cols) */}
            <div className="lg:col-span-6 space-y-5">
              <StockChart />
            </div>

            {/* Right Column: Order Placement & Order Book / Tape (3 cols) */}
            <div className="lg:col-span-3 space-y-5">
              <TradingTerminal />
              <div className="h-[340px]">
                <OrderBookAndTape />
              </div>
            </div>
          </div>

          {/* Quantitative Strategy & AI Trade Suggestions */}
          <div>
            <AITradeAnalyst />
          </div>

          {/* Bottom Section: Company Fundamentals, Analyst Ratings & News */}
          <div className="pt-2">
            <StockFundamentals />
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && <PortfolioView />}

      {activeTab === 'orders' && <OrdersAndLedgerView />}

      {activeTab === 'backtest' && <BacktestView />}

      {activeTab === 'funding' && <FundingView />}
    </main>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
        <TopBar />
        <MarketTickerBar />
        <MainContent />
        <PaymentModal />
        <ToastContainer />
      </div>
    </TradingProvider>
  );
}
