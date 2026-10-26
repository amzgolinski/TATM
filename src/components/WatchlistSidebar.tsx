import React, { useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { Search, Star, TrendingUp, TrendingDown } from 'lucide-react';

export const WatchlistSidebar: React.FC = () => {
  const {
    stocks,
    selectedSymbol,
    setSelectedSymbol,
    watchlists,
    toggleWatchlist,
  } = useTrading();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'watchlist' | 'stock' | 'etf' | 'crypto'>('all');

  const stockList = useMemo(() => {
    const symbolMap = new Map<string, (typeof stocks)[string]>();
    Object.values(stocks).forEach((s) => {
      if (s && s.symbol) {
        symbolMap.set(s.symbol, s);
      }
    });
    return Array.from(symbolMap.values());
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    return stockList.filter((s) => {
      const matchesSearch =
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'watchlist') return watchlists.includes(s.symbol);
      if (filter === 'stock') return s.type === 'stock';
      if (filter === 'etf') return s.type === 'etf';
      if (filter === 'crypto') return s.type === 'crypto';
      return true;
    });
  }, [stockList, search, filter, watchlists]);

  return (
    <aside className="bg-[#0f172a] rounded-xl border border-slate-800 p-3.5 flex flex-col h-full">
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symbol or name..."
          className="w-full bg-[#131d31] border border-slate-700/70 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 pb-2 border-b border-slate-800 text-xs overflow-x-auto scrollbar-none">
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'watchlist', label: `Starred (${watchlists.length})` },
            { id: 'stock', label: 'Stocks' },
            { id: 'etf', label: 'ETFs' },
            { id: 'crypto', label: 'Crypto' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-2 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              filter === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stocks list */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-0.5">
        {filteredStocks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No instruments found matching criteria.
          </div>
        ) : (
          filteredStocks.map((stock, idx) => {
            const isSelected = stock.symbol === selectedSymbol;
            const isStarred = watchlists.includes(stock.symbol);
            const isUp = stock.change >= 0;

            return (
              <div
                key={`${stock.symbol}-${idx}`}
                onClick={() => setSelectedSymbol(stock.symbol)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group ${
                  isSelected
                    ? 'bg-blue-950/60 border border-blue-600/50'
                    : 'hover:bg-[#131d31] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatchlist(stock.symbol);
                    }}
                    className="text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer"
                    aria-label={`Toggle star for ${stock.symbol}`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white tracking-wide">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {stock.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate max-w-[110px]">
                      {stock.name}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono tabular-nums">
                  <div className="text-xs font-semibold text-white">
                    ${stock.price.toFixed(2)}
                  </div>
                  <div
                    className={`text-[11px] font-medium flex items-center justify-end gap-0.5 ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="w-2.5 h-2.5" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5" />
                    )}
                    {isUp ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
