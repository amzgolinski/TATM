import React from 'react';
import { useTrading } from '../context/TradingContext';
import { ShieldCheck, Plus, RotateCcw } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    cashBalance,
    totalEquity,
    dailyPnL,
    dailyPnLPercent,
    positions,
    orders,
    isLiveConnected,
    isWsConnected,
    wsTickCount,
    refreshLiveMarketData,
    openPaymentModal,
    resetAccount,
  } = useTrading();

  const isDailyPositive = dailyPnL >= 0;
  const holdingCount = Object.keys(positions).length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0e1422] border-b border-slate-800/80 sticky top-0 z-30 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('terminal')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-blue-400 transition-colors whitespace-nowrap">
              TATM
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
            Trade Against the Machine
          </span>
        </button>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`cursor-pointer pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'terminal'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <span>Terminal & Charts</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`cursor-pointer pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'portfolio'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <span>Portfolio Tracker</span>
          <span className="text-[11px] font-mono font-bold text-slate-400">
            ({holdingCount})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`cursor-pointer pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <span>Orders & Ledger</span>
          {pendingCount > 0 && (
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('backtest')}
          className={`cursor-pointer pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'backtest'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <span>Backtester</span>
        </button>

        <button
          onClick={() => setActiveTab('funding')}
          className={`cursor-pointer pb-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === 'funding'
              ? 'text-white border-blue-500 font-semibold'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          Funding & Security
        </button>
      </nav>

      {/* Zone 3: 1 primary action with live summary statistics */}
      <div className="flex items-center gap-5 shrink-0">
        <div className="hidden xl:flex items-center gap-6 text-right text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Net Worth</span>
            <span className="text-white font-semibold font-mono tabular-nums text-sm">
              ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Today's P&L</span>
            <span
              className={`font-semibold font-mono tabular-nums text-sm ${
                isDailyPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isDailyPositive ? '+' : ''}
              ${dailyPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs">
                ({isDailyPositive ? '+' : ''}{dailyPnLPercent.toFixed(2)}%)
              </span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Buying Power</span>
            <span className="text-emerald-400 font-semibold font-mono tabular-nums text-sm">
              ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Live Data Feed Badge with Coinbase Public WebSocket indicator */}
          <button
            onClick={() => refreshLiveMarketData()}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#131d31] hover:bg-[#1a2640] border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 transition-colors cursor-pointer"
            title={isWsConnected ? `Coinbase Public WebSocket Active (${wsTickCount} live ticks received) · Click to refresh REST snapshot` : 'Market data connected'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : isLiveConnected ? 'bg-emerald-400' : 'bg-blue-400'}`} />
            <span className="hidden sm:inline font-semibold">
              {isWsConnected ? 'WS LIVE (COINBASE)' : isLiveConnected ? 'LIVE FEED' : 'CONNECTED'}
            </span>
          </button>

          <button
            onClick={() => openPaymentModal('deposit')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-900/30 whitespace-nowrap cursor-pointer"
            title="Secure Deposit Gateway"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Deposit Funds</span>
          </button>

          <button
            onClick={resetAccount}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset paper trading account"
            aria-label="Reset paper trading account"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
