import React from 'react';
import { useTrading } from '../context/TradingContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const MarketTickerBar: React.FC = () => {
  const { marketIndices, setSelectedSymbol, stocks, isLiveConnected } = useTrading();

  return (
    <div className="w-full bg-[#0a0e17] border-b border-slate-800/60 px-4 py-1.5 overflow-x-auto select-none scrollbar-none">
      <div className="flex items-center gap-6 text-xs min-w-max">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-800 text-slate-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{isLiveConnected ? 'REAL-WORLD MARKET DATA (LIVE)' : 'US MARKETS OPEN'}</span>
          <span className="text-slate-400">·</span>
          <span>NYSE / NASDAQ REAL-TIME FEEDS</span>
        </div>

        {marketIndices.map((idx, index) => {
          const isUp = idx.change >= 0;
          return (
            <div
              key={`${idx.symbol}-${index}`}
              className="flex items-center gap-2 group transition-colors"
            >
              <span className="text-slate-300 font-semibold">{idx.name}</span>
              <span className="text-white font-mono tabular-nums font-medium">
                {idx.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`flex items-center gap-0.5 font-mono tabular-nums font-medium ${
                  isUp ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="w-3 h-3 stroke-[2.5]" />
                )}
                {isUp ? '+' : ''}
                {idx.change.toFixed(2)} ({isUp ? '+' : ''}
                {idx.changePercent.toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
