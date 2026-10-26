import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';

export const OrderBookAndTape: React.FC = () => {
  const { orderBook, tape, selectedStock, setQuickTradePrefill } = useTrading();
  const [activeTab, setActiveTab] = useState<'book' | 'tape'>('book');

  // Max totals for depth bar percentage
  const maxAskTotal = orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].total : 1;
  const maxBidTotal = orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 1;

  const handlePriceClick = (price: number, side: 'buy' | 'sell') => {
    setQuickTradePrefill({
      symbol: selectedStock.symbol,
      price,
      side,
    });
  };

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 flex flex-col h-full">
      {/* Header and Switch */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('book')}
            className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'book'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Order Book (L2)
          </button>
          <button
            onClick={() => setActiveTab('tape')}
            className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'tape'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Time & Sales
          </button>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          SPREAD: ${orderBook.spread.toFixed(2)} ({orderBook.spreadPercent.toFixed(2)}%)
        </span>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 mt-2 text-xs font-mono tabular-nums">
          {/* Table Column Labels */}
          <div className="grid grid-cols-3 text-slate-400 text-[11px] pb-1 border-b border-slate-800/40">
            <span>PRICE (USD)</span>
            <span className="text-right">SIZE</span>
            <span className="text-right">TOTAL</span>
          </div>

          {/* Asks (Red, sorted high to low down to mid) */}
          <div className="flex flex-col-reverse space-y-reverse space-y-0.5 py-1.5 overflow-hidden">
            {orderBook.asks.slice(0, 6).map((ask, i) => {
              const depthPct = Math.min(100, (ask.total / maxAskTotal) * 100);
              return (
                <div
                  key={`ask-${i}`}
                  onClick={() => handlePriceClick(ask.price, 'buy')}
                  className="relative grid grid-cols-3 py-0.5 px-1 rounded hover:bg-slate-800/60 cursor-pointer group"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 rounded-sm pointer-events-none transition-all"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-rose-400 font-medium group-hover:underline">
                    ${ask.price.toFixed(2)}
                  </span>
                  <span className="text-right text-slate-300">{ask.size}</span>
                  <span className="text-right text-slate-400">{ask.total}</span>
                </div>
              );
            })}
          </div>

          {/* Mid Price Spread Bar */}
          <div className="py-1.5 my-1 px-2 bg-[#131d31] rounded flex items-center justify-between border-y border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">MARKET:</span>
              <span className="text-white font-bold text-sm">
                ${selectedStock.price.toFixed(2)}
              </span>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                selectedStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {selectedStock.change >= 0 ? '▲' : '▼'}{' '}
              {Math.abs(selectedStock.changePercent).toFixed(2)}%
            </span>
          </div>

          {/* Bids (Green, sorted high to low) */}
          <div className="flex flex-col space-y-0.5 py-1.5 overflow-hidden">
            {orderBook.bids.slice(0, 6).map((bid, i) => {
              const depthPct = Math.min(100, (bid.total / maxBidTotal) * 100);
              return (
                <div
                  key={`bid-${i}`}
                  onClick={() => handlePriceClick(bid.price, 'sell')}
                  className="relative grid grid-cols-3 py-0.5 px-1 rounded hover:bg-slate-800/60 cursor-pointer group"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded-sm pointer-events-none transition-all"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-emerald-400 font-medium group-hover:underline">
                    ${bid.price.toFixed(2)}
                  </span>
                  <span className="text-right text-slate-300">{bid.size}</span>
                  <span className="text-right text-slate-400">{bid.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Live Time & Sales Tape */
        <div className="flex flex-col flex-1 mt-2 text-xs font-mono tabular-nums overflow-y-auto max-h-[300px]">
          <div className="grid grid-cols-3 text-slate-400 text-[11px] pb-1 border-b border-slate-800/40">
            <span>TIME</span>
            <span className="text-right">PRICE</span>
            <span className="text-right">SHARES</span>
          </div>
          <div className="space-y-1 py-1">
            {tape.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-3 py-0.5 px-1 hover:bg-slate-800/40 rounded transition-colors"
              >
                <span className="text-slate-400 text-[11px]">
                  {new Date(t.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span
                  className={`text-right font-medium ${
                    t.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  ${t.price.toFixed(2)}
                </span>
                <span className="text-right text-slate-300 font-medium">{t.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
